
const fs = require("fs");
const html = fs.readFileSync("src/main/resources/static/admin.html", "utf-8");
const scriptMatches = html.match(/<script>(.*?)<\/script>/s);
if(scriptMatches) {
    try {
        new Function(scriptMatches[1]);
        console.log("Syntax OK");
    } catch(e) {
        console.log("Syntax Error: " + e.message);
    }
}

