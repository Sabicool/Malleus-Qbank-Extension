chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractAndSearchTag
  });
});

function extractAndSearchTag() {
  const url = window.location.href;
  let itemNumber;

  // Check if the URL matches the first pattern: https://emedici.com/app/share/question/####
  const matchShareQuestion = url.match(/https:\/\/emedici.com\/app\/share\/question\/(\d+)/);
  if (matchShareQuestion) {
    itemNumber = matchShareQuestion[1];
  } else {
    // Otherwise, locate the element with the text "Item #____" as previously implemented
    let tagElement = document.querySelector("div.px-sm.py-xs.color-muted.text-xs");
    itemNumber = tagElement ? tagElement.textContent.match(/\d+/)[0] : null;
  }

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
