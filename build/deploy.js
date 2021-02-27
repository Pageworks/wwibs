const ghPages = require("gh-pages");

const NAME = "Pageworks";
const EMAIL = "web@page.works";
const USERNAME = "Pageworks";
const PROJECT = "wwibs";

ghPages.publish(
    "public",
    {
        user: {
            name: NAME,
            email: EMAIL,
        },
        repo: "https://" + process.env.ACCESS_TOKEN + "@github.com/" + USERNAME + "/" + PROJECT + ".git",
        silent: true,
    },
    error => {
        if (error) {
            console.log(error);
        }
    }
);
