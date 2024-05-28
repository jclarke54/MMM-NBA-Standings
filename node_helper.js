const axios = require('axios');
const cheerio = require('cheerio');
const NodeHelper = require('node_helper');

// User agents for making HTTP requests
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
];

// URL of the NBA standings page
const standingsUrl = 'https://www.espn.com/nba/standings/_/group/league';

// Get a random user agent for each request
const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// Set headers for HTTP requests
const headers = {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
};

// An array to store the fetched data
let payload = [];

// Define NBA conferences and divisions
const easternConference = [
    "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets", "Chicago Bulls",
    "Cleveland Cavaliers", "Detroit Pistons", "Indiana Pacers", "Miami Heat", "Milwaukee Bucks",
    "New York Knicks", "Orlando Magic", "Philadelphia 76ers", "Toronto Raptors", "Washington Wizards"
];

const westernConference = [
    "Dallas Mavericks", "Denver Nuggets", "Golden State Warriors", "Houston Rockets", "LA Clippers",
    "Los Angeles Lakers", "Memphis Grizzlies", "Minnesota Timberwolves", "New Orleans Pelicans",
    "Oklahoma City Thunder", "Phoenix Suns", "Portland Trail Blazers", "Sacramento Kings",
    "San Antonio Spurs", "Utah Jazz"
];

const divisions = {
    "Southeast": ["Atlanta Hawks", "Charlotte Hornets", "Miami Heat", "Orlando Magic", "Washington Wizards"],
    "Atlantic": ["Boston Celtics", "Brooklyn Nets", "New York Knicks", "Philadelphia 76ers", "Toronto Raptors"],
    "Southwest": ["Dallas Mavericks", "Houston Rockets", "Memphis Grizzlies", "New Orleans Pelicans", "San Antonio Spurs"],
    "Northwest": ["Denver Nuggets", "Minnesota Timberwolves", "Oklahoma City Thunder", "Portland Trail Blazers", "Utah Jazz"],
    "Pacific": ["Golden State Warriors", "LA Clippers", "Los Angeles Lakers", "Phoenix Suns", "Sacramento Kings"],
    "Central": ["Chicago Bulls", "Cleveland Cavaliers", "Detroit Pistons", "Indiana Pacers", "Milwaukee Bucks"]
};

const teamLogos = {
    "ATL": "./Logos/Hawks.png", "BOS": "./Logos/Celtics.png", "BKN": "./Logos/Nets.png", "CHA": "./Logos/Hornets.png",
    "CHI": "./Logos/Bulls.png", "CLE": "./Logos/Cavs.png", "DAL": "./Logos/Mavs.png", "DEN": "./Logos/Nuggets.png",
    "DET": "./Logos/Pistons.png", "GS": "./Logos/Warriors.png", "HOU": "./Logos/Rockets.png", "IND": "./Logos/Pacers.png",
    "LAC": "./Logos/Clippers.png", "LAL": "./Logos/Lakers.png", "MEM": "./Logos/Grizzlies.png", "MIA": "./Logos/Heat.png",
    "MIL": "./Logos/Bucks.png", "MIN": "./Logos/Timberwolves.png", "NO": "./Logos/Pelicans.png", "NY": "./Logos/Knicks.png",
    "OKC": "./Logos/Thunder.png", "ORL": "./Logos/Magic.png", "PHI": "./Logos/76ers.png", "PHX": "./Logos/Suns.png",
    "POR": "./Logos/TrailBlazers.png", "SAC": "./Logos/Kings.png", "SA": "./Logos/Spurs.png", "TOR": "./Logos/Raptors.png",
    "UTAH": "./Logos/Jazz.png", "WAS": "./Logos/Wizards.png"
};

module.exports = NodeHelper.create({
    start: function () {
        console.log('MMM-NBA-Standings helper started...');

        // Initial scraping when the module starts
        this.scrapeStandingsData();

        // Schedule periodic updates every 12 hours.
        setInterval(() => {
            this.scrapeStandingsData();
        }, 300000 * 12 * 12); // 12 hours
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "START_Standings_SCRAPE" || notification === "UPDATE_Standings_DATA") {
            console.log('Received START_Standings_SCRAPE or UPDATE_Standings_DATA notification');
            this.scrapeStandingsData();
        }
    },

    // Function to scrape ScoreBoard data from the specified URL.
    scrapeStandingsData: function () {
        // Function to fetch NBA data from a given URL
        async function fetchNBAData(url) {
            try {
                const response = await axios.get(url, { headers });
                if (response.status !== 200) {
                    throw new Error(`Bad status (${response.status}) while fetching data from: ${url}`);
                }
                return response.data;
            } catch (error) {
                console.error(`Error fetching data from ${url}:`, error);
                return null;
            }
        }

        // Function to parse NBA standings
        async function parseStandings() {
            // Fetch HTML content of the standings page
            const html = await fetchNBAData(standingsUrl);
            if (!html) return;

            // Use Cheerio to parse the HTML
            const $ = cheerio.load(html);
            const teamsNames = [];
            const teamsStats = [];
            const standings = [];

            // Extract team names from the HTML
            $('.Table__TBODY .Table__TR .team-link a[href^="/nba/team/"]').each((index, element) => {
                if (index % 3 !== 0) {
                    const teamName = $(element).text().trim();
                    teamsNames.push({ teamName });
                }
            });

            // Process the extracted team names and stats
            // Create objects for each team with their stats
            for (let i = 0; i < teamsNames.length; i++) {
                if (i % 2 !== 0) continue;
                const obj = {
                    name: teamsNames[i + 1].teamName,
                    abbreviation: teamsNames[i].teamName
                };
                standings.push(obj);
            }

            // Extract team statistics from the HTML
            $('.stat-cell').each((index, element) => {
                const dataPoint = $(element).text().trim();
                teamsStats.push(dataPoint);
            });

            standings.forEach((team, i) => {
                const baseIndex = i * 13;
                team.ranking = i + 1;
                team.wins = parseInt(teamsStats[baseIndex], 10);
                team.losses = parseInt(teamsStats[baseIndex + 1], 10);
                team.winPercent = parseFloat(teamsStats[baseIndex + 2]);
                team.gamesBack = teamsStats[baseIndex + 3] === "-" ? 0 : parseFloat(teamsStats[baseIndex + 3]);
                team.homeRecord = teamsStats[baseIndex + 4];
                team.awayRecord = teamsStats[baseIndex + 5];
                team.divisionRecord = teamsStats[baseIndex + 6];
                team.conferenceRecord = teamsStats[baseIndex + 7];
                team.pointsPerGame = parseFloat(teamsStats[baseIndex + 8]);
                team.opponentPointsPerGame = parseFloat(teamsStats[baseIndex + 9]);
                team.pointDifferential = parseFloat(teamsStats[baseIndex + 10]);
                team.streak = teamsStats[baseIndex + 11];
                team.lastTen = teamsStats[baseIndex + 12];

                team.conference = easternConference.includes(team.name) ? "Eastern" : "Western";
                const division = Object.keys(divisions).find(div => divisions[div].includes(team.name));
                if (division) {
                    team.division = division;
                }

                if (teamLogos.hasOwnProperty(team.abbreviation)) {
                    team.teamLogo = teamLogos[team.abbreviation];
                }
            });

            const getDivisionTeams = (division) => divisions[division].map(team => standings.find(t => t.name === team));

            ['Eastern', 'Western'].forEach(conference => {
                payload.push({
                    conference,
                    standings: standings.filter(team => team.conference === conference)
                });

                Object.keys(divisions).forEach(division => {
                    const divisionTeams = getDivisionTeams(division).filter(team => team.conference === conference);
                    if (divisionTeams.length) {
                        payload.push({
                            division,
                            standings: divisionTeams
                        });
                    }
                });
            });

            //console.log(JSON.stringify(payload, null, 2));
        }

        // Function to parse the NBA playoff bracket
        async function parsePlayoffBracket() {
            // URL of the NBA playoff bracket page
            const playoffUrl = "https://www.espn.com/nba/playoff-bracket";

            try {
                // Fetch HTML content of the playoff bracket page
                const html = await fetchNBAData(playoffUrl);
                if (!html) return;

                // Use Cheerio to parse the HTML
                const $ = cheerio.load(html);
                const playoffTeams = [];
                const playoffBracket = [];

                // Extract team names from the playoff bracket HTML
                $('.BracketCell__Name').each((index, element) => {
                    const teamName = $(element).text().trim();
                    playoffTeams.push(teamName);
                });

                let j = 0;

                for (let i = 0; i < playoffTeams.length; i += 2) {
                    const team1 = playoffTeams[i];
                    const team2 = playoffTeams[i + 1];
                    let round, conference, matchup, seriesTitle;

                    function isSubstringInArray(substring, array) {
                        for (let str of array) {
                            if (str.includes(substring)) {
                                return true;
                            }
                        }
                        return false;
                    }

                    // Determine conference based on teams
                    if (isSubstringInArray(team1, westernConference)) {
                        conference = "Western";
                    } else {
                        conference = "Eastern";
                    }

                    // Determine the round based on the index
                    const totalGames = playoffTeams.length / 2;

                    if (totalGames === 8) {
                        round = "Round 1";
                    } else if (totalGames === 12) {
                        if (j < 4 || j > totalGames - 4) {
                            round = "Round 1";
                        } else {
                            round = "Semi-Finals";
                        }
                    } else if (totalGames === 14 || totalGames === 15) {
                        if (j < 4 || j > totalGames - 5) {
                            round = "Round 1";
                        } else if ((j > 3 && j < 6) || (j > 7 && j < 11)) {
                            round = "Semi-Finals";
                        } else {
                            round = "Finals";
                        }
                    }
                    j++;

                    const obj = {
                        team1,
                        team2,
                        conference,
                        round // Add the round property
                    };

                    playoffBracket.push(obj);
                    //console.log(totalGames)
                }
                playoffBracket.forEach((matchup, i) => {
                    matchup.seriesTitle = `${matchup.conference} Conference ${matchup.round}`;
                });

                return playoffBracket; // Return the playoffBracket array

            } catch (error) {
                console.error('Error parsing playoff bracket:', error);
                return []; // Return an empty array in case of error
            }
        }

        // Main function to orchestrate the data fetching and parsing
        async function main() {
            // Fetch and parse NBA standings
            const standings = await parseStandings();

            // Fetch and parse NBA playoff bracket
            const playoffBracket = await parsePlayoffBracket(); // Store the returned playoffBracket array

            // Determine the length of playoffBracket array
            const x = playoffBracket.length;

            // Adjust payload based on the length of playoffBracket array
            if (x < 8) {
                payload = payload.filter(item => item.hasOwnProperty('conference'));
            } else if (x >= 8 && x <= 12) {
                payload = playoffBracket.filter((_, index) => index < 4 || index > x - 5);
            } else if (x === 12) {
                payload = playoffBracket;
            } else if (x > 12 && x < 14) {
                payload = playoffBracket.filter((_, index) => index < 6 || index > x - 7);
            } else if (x === 14) {
                payload = playoffBracket;
            }

            // Output the final payload
            console.log(JSON.stringify(payload, null, 2));
            return payload;
        }

        main().then(() => {
            // Send the scraped data to the frontend for display.
            this.sendSocketNotification('Standings_Data', { payload });
        }).catch((error) => {
            console.error('Error scraping Standings:', error);
        });
    }
});
