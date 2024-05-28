Module.register("MMM-NBA-Standings", {
    // Default module config.
    defaults: {
        // Define placeholder for the scraped data.
        scrapedStandingsData: [],
    },

    // Override the start method.
    start: function () {
        console.log('Starting MagicMirror module: MMM-NBA-Standings');
        this.sendSocketNotification("START_Standings_SCRAPE", this.config);

        // Schedule periodic updates every 5 minutes (300,000 milliseconds).
        setInterval(() => {
            this.sendSocketNotification("UPDATE_Standings_DATA", this.config);
        }, 300000); // 5 minutes
    },

    // Override the getDom method to generate module content.
    getDom: function () {
        // Create a wrapper div for the module content.
        const moduleWrapper = document.createElement("div");
        moduleWrapper.className = "moduleWrapper";
        const wrapper = document.createElement("div");
        wrapper.className = "standingsWrapper";
        moduleWrapper.appendChild(wrapper);

        // Get the scraped standings data from the module's config.
        const scrapedStandings = this.config.scrapedStandingsData;

        // Check if there's any scraped data.
        if (scrapedStandings && scrapedStandings.length > 0) {
            if (scrapedStandings.length === 30) {
            // Iterate over the scraped standings data and create elements to display the information.
            scrapedStandings.forEach(conference => {
                const conferenceWrapper = document.createElement("div");
                conferenceWrapper.className = "conferenceWrapper";
                conferenceWrapper.innerHTML = `<h2>${conference.conference}</h2>`;

                conference.standings.forEach(team => {
                    const teamWrapper = document.createElement("div");
                    teamWrapper.className = "teamWrapper";
                    teamWrapper.innerHTML = `
                        <p class="teamData">Team: ${team.name}</p>
                        <p class="teamData">Wins: ${team.wins}</p>
                        <p class="teamData">Losses: ${team.losses}</p>
                        <p class="teamData">Win Percentage: ${team.winPercent}</p>
                        <p class="teamData">Games Back: ${team.gamesBack}</p>
                        <p class="teamData">Home Record: ${team.homeRecord}</p>
                        <p class="teamData">Away Record: ${team.awayRecord}</p>
                        <p class="teamData">Division Record: ${team.divisionRecord}</p>
                        <p class="teamData">Conference Record: ${team.conferenceRecord}</p>
                        <p class="teamData">Points Per Game: ${team.pointsPerGame}</p>
                        <p class="teamData">Opponent Points Per Game: ${team.opponentPointsPerGame}</p>
                        <p class="teamData">Point Differential: ${team.pointDifferential}</p>
                        <p class="teamData">Streak: ${team.streak}</p>
                        <p class="teamData">Last 10: ${team.lastTen}</p>
                    `;
                    conferenceWrapper.appendChild(teamWrapper);
                });

                wrapper.appendChild(conferenceWrapper);
            });
        } else if (scrapedStandings.length !== 30 && scrapedStandings.length > 0) {
            // Handle playoff bracket data
            // Iterate over the scraped playoff bracket data and create elements to display the information.
            scrapedStandings.forEach(playoffBracket => {
                const playoffBracketWrapper = document.createElement("div");
                playoffBracketWrapper.className = "playoffBracketWrapper";
    
                // Add logic to display playoff bracket data
                playoffBracket.playoffBracket.forEach(matchup => {
                    const matchupWrapper = document.createElement("div");
                    matchupWrapper.className = "matchupWrapper";
                    matchupWrapper.innerHTML = `
                        <p class="seriesTitle">${matchup.seriesTitle}</p>
                        <p>${matchup.team1} vs ${matchup.team2}</p>
                    `;
                    playoffBracketWrapper.appendChild(matchupWrapper);
                });
    
                moduleWrapper.appendChild(playoffBracketWrapper);
            });
        }
    } else {
            // Display a message if no data is available.
            wrapper.innerHTML = "No standings data available";
        }

        // Get the last updated time
        let d = new Date();
        let day = d.getDate();
        let month = d.getMonth() + 1;
        let hours = d.getHours();
        let dayOrNight = "A.M";
        if (hours >= 12) {
            dayOrNight = "P.M";
        }
        if (hours > 12) {
            hours -= 12;
        }
        let minutes = d.getMinutes();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }

        // Store the formatted time of last update as a string
        let dateAndTime = month + "/" + day + " at " + hours + ":" + minutes + " " + dayOrNight;

        // Append the time of last update to the wrapper
        const lastUpdatedWrapper = document.createElement("div");
        const lastUpdated = document.createElement("h2");
        const time = document.createTextNode("Last updated: " + dateAndTime);
        lastUpdated.appendChild(time);
        lastUpdatedWrapper.appendChild(lastUpdated);
        lastUpdatedWrapper.className = "standingsTime";
        moduleWrapper.insertBefore(lastUpdatedWrapper, moduleWrapper.firstChild);

        return moduleWrapper;
    },

    // Override the socketNotificationReceived method to handle data from node_helper.
    socketNotificationReceived: function (notification, payload) {
        if (notification === "Standings_Data") {
            // Update the module's config with the scraped data.
            this.config.scrapedStandingsData = payload;

            // Update the module's DOM with the new data.
            this.updateDom();
        }
    },

    // Override the stop method to clear the interval when the module is stopped
    stop: function () {
        // Not implemented for now.
    },
});
