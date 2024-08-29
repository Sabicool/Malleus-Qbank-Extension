chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractAndSearchTag
  });
});

function extractAndSearchTag() {
  // Locate the element with the text "Item #2492"
  let tagElement = document.querySelector("div.px-sm.py-xs.color-muted.text-xs");
  let itemNumber = tagElement ? tagElement.textContent.match(/\d+/)[0] : null;

  if (itemNumber) {
    // Calculate the range for the itemNumber
    let lowerBound = Math.floor(itemNumber / 1000) * 1000;
    let upperBound = lowerBound + 999;
    let rangeTag = `${lowerBound}-${upperBound}`;
    
    // Construct the full tag-based query
    let query = `tag:#Malleus_CM::#Question_Banks::eMedici::${rangeTag}::${itemNumber}`;
    
    // Send the query to Anki-Connect via background script
    chrome.runtime.sendMessage({ action: "searchTag", query: query });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "searchTag") {
    const query = request.query;
    guiBrowseInAnki(query);
  }
});

function guiBrowseInAnki(query) {
  fetch("http://localhost:8765", {
    method: "POST",
    body: JSON.stringify({
      action: "guiBrowse",
      version: 6,
      params: {
        query: query,
        reorderCards: {
          order: "descending",
          columnId: "noteCrt"
        }
      }
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.error("Anki-Connect Error:", data.error);
      } else {
        console.log("Anki Browse Result:", data);
      }
    })
    .catch(error => console.error("Fetch Error:", error));
}
