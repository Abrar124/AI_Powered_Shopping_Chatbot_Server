// const express = require('express');
// const axios = require('axios');
// const cheerio = require('cheerio');
// const app = express();

// // Define a route to fetch search results
// app.get('/search', async (req, res) => {
//     const query = req.query.q;
//     try {
//         // Fetch search results from Google
//         const searchResults = await fetchSearchResults(query);

//         // Send search results as JSON response
//         res.json(searchResults);
//     } catch (error) {
//         console.error('Error fetching search results:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // Function to fetch search results from Google
// async function fetchSearchResults(query) {
//     const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
//     const response = await axios.get(searchUrl, {
//         headers: {
//             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
//         }
//     });
//     const htmlContent = response.data;
//     const $ = cheerio.load(htmlContent);

//     const searchResults = [];
//     $('div.g').each((index, element) => {
//         const title = $(element).find('h3').text();
//         const link = $(element).find('a').attr('href');
//         searchResults.push({ title, link });
//     });

//     return searchResults;
// }

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is listening on port ${PORT}`);
// });


const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// Define a route to handle Dialogflow webhook requests
app.post('/webhook', async (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;
  const query = req.body.queryResult.queryText;

  // Check the intent
  if (intentName === 'Find_Product') {
    try {
      // Fetch product suggestions based on user query
      const products = await fetchProductLinks(query);

      // Format the response
      const response = formatResponse(products);

      // Send response to Dialogflow
      res.json(response);
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
      res.json({ fulfillmentText: "Sorry, I couldn't fetch product suggestions at the moment." });
    }
  } else {
    res.json({ fulfillmentText: "I'm sorry, I couldn't understand that." });
  }
});

// Function to fetch product links from Google
async function fetchProductLinks(query) {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const response = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const htmlContent = response.data;
  const $ = cheerio.load(htmlContent);

  const productLinks = [];
  $('div.g').each((index, element) => {
    const title = $(element).find('h3').text();
    const link = $(element).find('a').attr('href');

    if (title && link) {
      productLinks.push({ title, link });
    }

    // Limit to 3 results
    if (productLinks.length >= 3) {
      return false;
    }
  });

  return productLinks;
}

// Function to format the response for Dialogflow
function formatResponse(products) {
  if (products.length === 0) {
    return "I couldn't find any products matching your query.";
  }

  // let response = 'Here are some suggestions for you: ';
  // products.forEach(product => {
  //     response += `Title: ${product.title} `;
  //     if (product.price) {
  //         response += `Price: ${product.price} `;
  //     }
  //     response += `Link: ${product.link} `;
  // });
  const response = {
    fulfillmentMessages: [
      {
        platform: "PLATFORM_UNSPECIFIED",
        text: {
          text: [
            "Here are some suggestions for you:"
          ]
        }
      },
      {
        platform: "PLATFORM_UNSPECIFIED",
        payload: {
          richContent: [
            products.slice(0, 3).map(product => ({
              type: "info",
              title: product.title,
              actionLink: product.link
            }))
          ]
        }
      }
    ]
  };
  // let response =
  // {
  //   "fulfillmentMessages": [
  //     {
  //       "platform": "PLATFORM_UNSPECIFIED",
  //       "text": {
  //         "text": [
  //           "Here are some suggestions for you:"
  //         ]
  //       }
  //     },
  //     {
  //       "platform": "PLATFORM_UNSPECIFIED",
  //       "payload": {
  //         "richContent": [
  //           [
  //             {
  //               "type": "info",
  //               "title": "Core I5 2nd Gen - Computers for sale in Pakistan",
  //               "actionLink": "https://www.olx.com.pk/computers-computers-accessories_c443/q-core-i5-2nd-gen?filter=type_eq_computers"
  //             },
  //             {
  //               "type": "info",
  //               "title": "Gaming Pc,Core i5 2nd Generation 2400,8 GB DDR3 Ram ...",
  //               "actionLink": "https://www.daraz.pk/products/gaming-pccore-i5-2nd-generation-24008-gb-ddr3-ram500-gb-hdd-graphics-cardradeon-7470-i423674749.html"
  //             },
  //             {
  //               "type": "info",
  //               "title": "Core I5 2nd Gen - Computers & Accessories",
  //               "actionLink": "https://www.olx.com.pk/computers-accessories_c443/q-core-i5-2nd-gen"
  //             }
  //           ]
  //         ]
  //       }
  //     }
  //   ]
  // }




  return response;
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
