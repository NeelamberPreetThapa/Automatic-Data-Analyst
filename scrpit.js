document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const fileInput = document.getElementById("file");

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent the default form submission

        if (fileInput.files.length === 0) {
            alert("Please select a file.");
            return;
        }

        const file = fileInput.files[0];

        if (!file.name.endsWith(".csv")) {
            alert("Only CSV files are supported at the moment.");
            return;
        }

        try {
            const data = await file.text();
            const parsedData = parseCSV(data);
            const stats = calculateStats(parsedData);

            // Create a new page for displaying results
            displayResultsPage(stats, parsedData);
        } catch (error) {
            console.error("Error processing file:", error);
            alert("There was an error processing your file.");
        }
    });

    function parseCSV(data) {
        const rows = data.trim().split("\n").slice(0, 51); // Take the first 50 rows + header
        const headers = rows.shift().split(",");

        const parsedData = rows.map(row => {
            const values = row.split(",");
            return headers.reduce((obj, header, index) => {
                obj[header] = parseFloat(values[index]) || values[index];
                return obj;
            }, {});
        });

        return parsedData;
    }

    function calculateStats(data) {
        const numericColumns = Object.keys(data[0]).filter(key => !isNaN(data[0][key]));

        return numericColumns.map(column => {
            const values = data.map(row => row[column]).filter(value => !isNaN(value));

            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const sorted = values.slice().sort((a, b) => a - b);
            const median = sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)];
            const mode = findMode(values);

            return { column, mean, median, mode };
        });
    }

    function findMode(values) {
        const frequency = {};
        let maxFreq = 0;
        let mode = [];

        values.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
            if (frequency[value] > maxFreq) {
                maxFreq = frequency[value];
                mode = [value];
            } else if (frequency[value] === maxFreq) {
                mode.push(value);
            }
        });

        return [...new Set(mode)];
    }

    function displayResultsPage(stats, data) {
        const newWindow = window.open("", "_blank");

        if (!newWindow) {
            alert("Please allow pop-ups for this site to view the results.");
            return;
        }

        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Analysis Results</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f9;
                        margin: 20px;
                    }
                    .stats {
                        margin-bottom: 20px;
                    }
                    .stats div {
                        margin-bottom: 15px;
                    }
                    h3 {
                        color: #333;
                    }
                </style>
            </head>
            <body>
                <h1>Analysis Results</h1>
                <div class="stats">
                    ${stats.map(stat => `
                        <div>
                            <h3>${stat.column}</h3>
                            <p>The Mean of this numerical column is: ${stat.mean.toFixed(2)}</p>
                            <p>The Median of this numerical column is: ${stat.median.toFixed(2)}</p>
                            <p>The Mode of this numerical column is: ${stat.mode.join(", ")}</p>
                        </div>
                    `).join("")}
                </div>
                <h2>Data Preview</h2>
                <table border="1" cellpadding="5" cellspacing="0">
                    <thead>
                        <tr>
                            ${Object.keys(data[0]).map(header => `<th>${header}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${Object.values(row).map(value => `<td>${value}</td>`).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </body>
            </html>
        `);

        newWindow.document.close();
    }
});
