import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const e2eDir = resolve(import.meta.dirname, '../e2e')
const layoutsDir = resolve(e2eDir, 'layouts')
const slidesPath = resolve(e2eDir, 'slides.md')
const defaultLayoutPath = resolve(layoutsDir, 'default.vue')

let originalSlides: string
let originalLayout: string

test.describe('Layout Editor E2E', () => {
  test.beforeAll(() => {
    originalSlides = readFileSync(slidesPath, 'utf-8')
    originalLayout = readFileSync(defaultLayoutPath, 'utf-8')
  })

  test.afterAll(() => {
    writeFileSync(slidesPath, originalSlides, 'utf-8')
    writeFileSync(defaultLayoutPath, originalLayout, 'utf-8')
    for (const file of readdirSync(layoutsDir)) {
      if (file !== 'default.vue' && file.endsWith('.vue')) {
        rmSync(resolve(layoutsDir, file))
      }
    }
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the slide content to be visible
    await page.waitForSelector('.content');
    // Wait a bit for the JS to initialize
    await page.waitForTimeout(2000);
    // Open the editor by clicking the "Show editor" button in the nav controls
    await page.locator('button:has-text("Show editor")').click();
    // Switch to layout tab
    await page.locator('button:has-text("Switch to layout tab")').click();
    // Wait for layout panel content to be visible
    await page.waitForSelector('.layout-editor-panel', { timeout: 30000 });
  });

  test('can toggle layout tab and see elements', async ({ page }) => {
    // Check if layout tab content is visible
    await expect(page.locator('.layout-editor-panel')).toBeVisible();
    // Check if elements are listed
    const elements = page.locator('.lep-el');
    await expect(elements.first()).toBeVisible();
  });

  test('selecting an element shows its active box', async ({ page }) => {
    type El = { name: string; selector: string; btnLabel: string };
    const els: El[] = [
      { name: 'red-bar', selector: '.red-bar', btnLabel: 'Red Bar' },
      { name: 'logo',     selector: '.logo',     btnLabel: 'Logo' },
      { name: 'title',    selector: '.title-overlay', btnLabel: 'Title' },
      { name: 'content',  selector: '.content',  btnLabel: 'Content' },
    ];

    for (const el of els) {
      // Click the element button in the layout panel
      const btn = page.locator('.lep-el').filter({ hasText: el.btnLabel });
      await btn.click();

      // Wait for the button to become active (editor.selected was set)
      await expect(btn).toHaveClass(/active/);

      // The element in the slide should now also have the el-active class
      await expect(page.locator(el.selector)).toHaveClass(/el-active/);
    }
  });

  async function getSlideScale(page: any): Promise<number> {
    const container = page.locator('.slidev-layout.default');
    const rect = await container.boundingBox();
    const scrollWidth = await container.evaluate((el: Element) => el.scrollWidth);
    return rect.width / scrollWidth;
  }

  async function dragElement(page: any, selector: string, ddx: number, ddy: number) {
    const el = page.locator(selector);
    const box = await el.boundingBox();
    if (!box) throw new Error(`Element ${selector} not found`);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + ddx, cy + ddy, { steps: 10 });
    await page.mouse.up();
  }

  test('can drag logo and see position update in properties', async ({ page }) => {
    const scale = await getSlideScale(page);

    // Select the logo element
    const logoBtn = page.locator('.lep-el').filter({ hasText: 'Logo' });
    await logoBtn.click();
    await expect(logoBtn).toHaveClass(/active/);

    // Read initial X and Y positions
    const xInput = page.locator('.lep-props label').filter({ hasText: 'X:' }).locator('input');
    const yInput = page.locator('.lep-props label').filter({ hasText: 'Y:' }).locator('input');
    const initialX = parseInt(await xInput.inputValue(), 10);
    const initialY = parseInt(await yInput.inputValue(), 10);

    // Drag the logo right and down (use smaller dx so X doesn't clamp to 0)
    const vpDx = 10;
    const vpDy = 50;
    await dragElement(page, '.logo', vpDx, vpDy);

    // Expected CSS-pixel deltas = viewport delta / scale
    const cssDx = Math.round(vpDx / scale);
    const cssDy = Math.round(vpDy / scale);

    // Logo uses `right:` positioning (invertX: true):
    //   dragging right (positive dx) decreases the X value
    const newX = parseInt(await xInput.inputValue(), 10);
    const newY = parseInt(await yInput.inputValue(), 10);
    expect(newX).toBe(initialX - cssDx);
    expect(newY).toBe(initialY + cssDy);
  });

  test('can drag title and verify it follows the cursor accurately', async ({ page }) => {
    const scale = await getSlideScale(page);

    // Select the title element
    const titleBtn = page.locator('.lep-el').filter({ hasText: 'Title' });
    await titleBtn.click();
    await expect(titleBtn).toHaveClass(/active/);

    // Read initial X and Y positions
    const xInput = page.locator('.lep-props label').filter({ hasText: 'X:' }).locator('input');
    const yInput = page.locator('.lep-props label').filter({ hasText: 'Y:' }).locator('input');
    const initialX = parseInt(await xInput.inputValue(), 10);
    const initialY = parseInt(await yInput.inputValue(), 10);

    // Drag the title overlay right and down
    const vpDx = 100;
    const vpDy = 80;
    await dragElement(page, '.title-overlay', vpDx, vpDy);

    // Expected CSS-pixel deltas = viewport delta / scale
    const cssDx = Math.round(vpDx / scale);
    const cssDy = Math.round(vpDy / scale);

    // Title uses `left:` positioning (normal):
    //   dragging right increases X, dragging down increases Y
    const newX = parseInt(await xInput.inputValue(), 10);
    const newY = parseInt(await yInput.inputValue(), 10);
    expect(newX).toBe(initialX + cssDx);
    expect(newY).toBe(initialY + cssDy);
  });

  test('undo becomes enabled after dragging and resets positions', async ({ page }) => {
    const undoBtn = page.locator('.lep-btn').filter({ hasText: 'Undo' });

    // Undo should be disabled initially
    await expect(undoBtn).toBeDisabled();

    // Select the title and drag it
    const titleBtn = page.locator('.lep-el').filter({ hasText: 'Title' });
    await titleBtn.click();

    const titleOverlay = page.locator('.title-overlay');
    const box = await titleOverlay.boundingBox();
    if (!box) throw new Error('title-overlay not found');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50, { steps: 10 });
    await page.mouse.up();

    // Undo should now be enabled
    await expect(undoBtn).toBeEnabled();

    // Click undo
    await undoBtn.click();

    // Undo should be disabled again (no more history)
    await expect(undoBtn).toBeDisabled();
  });

  test('can save a new layout', async ({ page }) => {
    // Check "Save as new layout"
    const saveAsCheckbox = page.locator('input[type="checkbox"]');
    await expect(saveAsCheckbox).toBeChecked();

    // Enter a name
    await page.locator('.lep-name-row input').fill('test-layout-e2e');

    // Click Save
    await page.locator('.lep-btn.lep-btn-primary').click();

    // Wait for "Done" text
    await expect(page.locator('.lep-btn.lep-btn-primary')).toHaveText('Done');
  });
});
