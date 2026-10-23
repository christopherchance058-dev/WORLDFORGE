const {test,expect}=require('./fixtures');
const fs=require('node:fs');
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('.card')).toHaveCount(8);});
test('sample entries, search, categories and timeline',async({page})=>{
 await expect(page.locator('.card')).toHaveCount(8);
 await page.getByRole('searchbox').fill('cartographer');await expect(page.locator('.card')).toHaveCount(1);await expect(page.locator('.card')).toContainText('Elara');
 await page.getByRole('searchbox').fill('impossibleword');await expect(page.getByText('No entries found')).toBeVisible();
 await page.getByRole('searchbox').fill('');await page.locator('#navigation').getByRole('button',{name:/History/}).click();
 await expect(page.locator('.card')).toHaveCount(2);await expect(page.locator('.card').first()).toContainText('Year 412');await expect(page.locator('.card').last()).toContainText('Year 438');
});
test('create with image, persist, edit category and delete with cancellation',async({page})=>{
 await page.getByRole('button',{name:'New entry'}).click();await page.getByLabel('Title',{exact:true}).fill('Mira of the Moon');await page.getByLabel('Description',{exact:true}).fill('A keeper of lunar maps.');await page.getByLabel(/^Tags/).fill('moon, explorer');
 await page.locator('#entry-image').setInputFiles({name:'moon.png',mimeType:'image/png',buffer:await require('sharp')({create:{width:20,height:20,channels:3,background:'#559977'}}).png().toBuffer()});
 await expect(page.locator('#image-preview')).toBeVisible();await page.getByRole('button',{name:'Save entry'}).click();await page.reload();
 await page.getByRole('button',{name:'Open Mira of the Moon',exact:true}).click();await expect(page.locator('.detail-image')).toBeVisible();await page.getByRole('button',{name:'Edit entry',exact:true}).click();
 await page.getByLabel('Title',{exact:true}).fill('Mira’s Crossing');await page.getByLabel('Category',{exact:true}).selectOption('History');await page.getByRole('spinbutton',{name:'Timeline year (optional)',exact:true}).fill('-12');await page.getByRole('button',{name:'Save entry'}).click();
 await page.getByRole('button',{name:'Open Mira’s Crossing',exact:true}).click();await expect(page.locator('#detail')).toContainText('Year -12');await page.getByRole('button',{name:'Delete entry',exact:true}).click();await page.locator('#confirm').getByRole('button',{name:'Cancel'}).click();await expect(page.locator('#detail')).toBeVisible();
 await page.getByRole('button',{name:'Delete entry',exact:true}).click();await page.locator('#confirm').getByRole('button',{name:'Delete entry'}).click();await expect(page.locator('#detail')).not.toBeVisible();await expect(page.getByRole('button',{name:'Open Mira’s Crossing',exact:true})).toHaveCount(0);await page.reload();await expect(page.getByRole('button',{name:'Open Mira’s Crossing',exact:true})).toHaveCount(0);
});
test('export, replace and import backup round trip',async({page})=>{
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup'}).click();const download=await downloadPromise;const backupPath=await download.path();const data=await require('./fixtures').manifest(backupPath);expect(data.entries).toHaveLength(8);
 await page.locator('#backup-file').setInputFiles({name:'empty.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'worldforge',version:1,entries:[]}))});await page.locator('#confirm').getByRole('button',{name:'Import backup'}).click();await expect(page.locator('.card')).toHaveCount(0);await page.reload();await expect(page.locator('.card')).toHaveCount(0);
 await page.locator('#backup-file').setInputFiles(backupPath);await page.locator('#confirm').getByRole('button',{name:'Import backup'}).click();await expect(page.locator('.card')).toHaveCount(8);await page.reload();await expect(page.locator('.card')).toHaveCount(8);
});
test('invalid import leaves existing data intact and text is not executable',async({page})=>{
 await page.locator('#backup-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await page.locator('#confirm').getByRole('button',{name:'Import backup'}).click();await expect(page.getByRole('status')).toContainText('not valid JSON');await expect(page.locator('.card')).toHaveCount(8);
 await page.getByRole('button',{name:'New entry'}).click();await page.getByLabel('Title',{exact:true}).fill('<img src=x onerror=alert(1)>');await page.getByLabel('Description',{exact:true}).fill('<script>alert(1)</script>');await page.getByRole('button',{name:'Save entry'}).click();await expect(page.locator('.card h3').first()).toHaveText('<img src=x onerror=alert(1)>');await expect(page.locator('.card h3 img')).toHaveCount(0);
});
test('storage failure is reported without losing current entries',async({page})=>{
 await page.route('**/api/state',route=>route.request().method()==='PUT'?route.fulfill({status:507,contentType:'application/json',body:JSON.stringify({error:'Disk is full. Free space, then try again.'})}):route.continue());await page.getByRole('button',{name:'New entry'}).click();await page.getByLabel('Title',{exact:true}).fill('Unsaved');await page.getByLabel('Description',{exact:true}).fill('Must not pretend to save');await page.getByRole('button',{name:'Save entry'}).click();await expect(page.getByRole('status')).toContainText('Unable to save');await expect(page.locator('#editor')).toBeVisible();await page.reload();await expect(page.locator('.card')).toHaveCount(8);
});
test('desktop and mobile layout, no browser errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1440,height:1050});await page.reload();await page.screenshot({path:'test-results/worldforge-desktop.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/worldforge-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
