const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const ejs = require('ejs');
const cron = require('node-cron');


const jobWebsiteUrl = "https://www.jobz.pk/government-jobs/";

const scrapeAndSaveJobListings = async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(jobWebsiteUrl);

        // Wait for the required element to be available
        await page.waitForSelector('.first_big_4col');

        // Extracting job listings
        const jobListings = await page.evaluate(() => {
            const listings = [];
            var extraData = '';
            var jobDate = '';
            const jobContainers = document.querySelectorAll('.first_big_4col .row_container');

            jobContainers.forEach(container => {
                const titleElement = container.querySelector('.cell1 a');
                const title = titleElement ? titleElement.textContent.trim() : '';

                const industryElement = container.querySelector('.cell2 a');
                const industry = industryElement ? industryElement.textContent.trim() : '';

                const cityElement = container.querySelector('.cell_three .inner_cell:first-child a');
                const city = cityElement ? cityElement.textContent.trim() : '';

                const dateElement = container.querySelector('.cell_three .inner_cell:last-child');
                const date = dateElement ? dateElement.textContent.trim() : '';

                if (date) {
                    const parts = date.split(' ');
                    jobDate = parts[0];
                    extraData = parts.slice(1).join(' ');
                }

                const link = titleElement ? titleElement.href : '';

                listings.push({ title, industry, city, jobDate, extraData, link });
               
                
            });

            return listings;
        });

        // Generate HTML using EJS template
        const template = fs.readFileSync('job_listings_template.ejs', 'utf8');
        const html = ejs.render(template, { jobListings });

        // Save the generated HTML to a file
        fs.writeFile('job_listings.html', html, (err) => {
            if (err) throw err;
            console.log('Job listings saved to job_listings.html');
        });

        await browser.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

cron.schedule('*/1 * * * *', async () => {
    console.log('Running cron job...');
    await scrapeAndSaveJobListings();
});