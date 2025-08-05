const express = require('express');
const _ = require('lodash');

const app = express();
const port = 3000;

// Sample function with potential security issue
function getUserData(userId) {
    const query = "SELECT * FROM users WHERE id = " + userId; // SQL injection vulnerability
    return query;
}

// Sample function with performance issue
function inefficientSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}

// Sample API endpoint
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const userData = getUserData(userId);
    res.json({ query: userData });
});

// Sample complex function for testing
class DataProcessor {
    constructor(data) {
        this.data = data;
    }

    process() {
        return this.data
            .filter(item => item.active)
            .map(item => ({
                id: item.id,
                name: item.name.toUpperCase(),
                score: item.score * 2
            }))
            .sort((a, b) => b.score - a.score);
    }

    async asyncProcess() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.process());
            }, 100);
        });
    }
}

app.listen(port, () => {
    console.log(`Sample app listening at http://localhost:${port}`);
});

module.exports = { getUserData, inefficientSort, DataProcessor };