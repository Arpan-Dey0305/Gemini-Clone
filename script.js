const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

// API configuration
const API_KEY = "API_KEY";
const API_URL = `API_URLkey=${API_KEY}`;

const loadLocalStorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";

  //Apply the stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  //Restore saved chats
  chatList.innerHTML = savedChats || "";

  document.body.classList.toggle("hide-header", savedChats);
  chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
};

loadLocalStorageData();

//Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

//Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;
  const typingInterval = setInterval(() => {
    //Append each word to the text element with a space
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    //If all words are displayed
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML); //Save Chats to localstorage
    }
    chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
  }, 75);
};

//Fetch responses from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); //Get text Element

  //send a POST request to the API with the user's message
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      textElement.innerText = data.error?.message || "Something went wrong!";
      return;
    }
    //Get the API resopnse text  and remove * and # from it
    const apiResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text
        ?.replace(/\*\*(.*?)\*\*/g, "$1")
        ?.replace(/^#+\s?/gm, "") || "No response received.";
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

// Show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
          <img src="image/gemini.svg" alt="Gemini" class="avatar" />
          <p class="text"></p>
          <div class="loading-indicator">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
          </div>
        </div>
        <span onclick="copyMessage(this)" class="icon material-symbols-rounded"> content_copy </span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);

  chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
  generateAPIResponse(incomingMessageDiv);
};
// Copy message text to the clipboard
const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done"; //show tick icon
  setTimeout(() => (copyIcon.innerText = "content_copy"), 1000); //Revert icon after 1 second
};

//Handle sending outgoing chat message

const handleOutgoingChat = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return; //Exit If there is no message

  isResponseGenerating = true;

  const html = `<div class="message-content">
          <img src="image/user.jpg" alt="User_Image" class="avatar" />
          <p class="text"></p>
        </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); //Clear input field
  chatList.scrollTo(0, chatList.scrollHeight); //scroll to the bottom
  document.body.classList.add("hide-header"); // Hide the header once chat is start
  setTimeout(showLoadingAnimation, 500); // Show loading Animation after a delay
};

//Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach((suggestions) => {
  suggestions.addEventListener("click", () => {
    userMessage = suggestions.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

//Toogle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});
//delete all chats from local storagewhen button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all messages?")) {
    localStorage.removeItem("savedChats");
    loadLocalStorageData();
  }
});

// Prevent default form submission
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});
/* Click Flicker */
document.addEventListener("click", function (e) {
  const ring = document.createElement("span");
  ring.classList.add("click-ring");

  ring.style.left = e.clientX - 7 + "px";
  ring.style.top = e.clientY - 7 + "px";

  document.body.appendChild(ring);

  setTimeout(() => {
    ring.remove();
  }, 350);
});
