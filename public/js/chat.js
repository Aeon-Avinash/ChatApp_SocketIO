const socket = io();

// Elements
const $messageForm = document.getElementById("messageForm");
const $messageInput = document.getElementById("message");
const $sendBtn = document.getElementById("sendBtn");
const $shareLocationBtn = document.getElementById("shareLocation");
const $messages = document.getElementById("messages");
const $sidebar = document.getElementById("sidebar");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationMsgTemplate = document.getElementById("location-msg-template")
  .innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  // new messag PropTypes.element,
  const $newMessage = $messages.lastElementChild;

  // height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height of the Messages container
  const visibleHeight = $messages.offsetHeight;

  // Toital Height of Messages container
  const containerHeight = $messages.scrollHeight;

  // How far has the user scrolled below:
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

$messageForm.addEventListener("submit", e => {
  e.preventDefault();
  // disable form
  $sendBtn.setAttribute("disabled", "disabled");

  const formData = new FormData(e.target);
  const message = formData.get("message");
  socket.emit("sendMessage", { message }, errMsg => {
    // enable form
    $sendBtn.removeAttribute("disabled");
    $messageInput.value = "";
    $messageInput.focus();

    if (errMsg) {
      return console.log(errMsg);
    }
    console.log("The message was delivered!");
  });
});

socket.on("message", ({ message, username, createdAt }) => {
  const html = Mustache.render(messageTemplate, {
    message,
    username,
    createdAt: moment(createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMsg", ({ locationMsg, username, createdAt }) => {
  const html = Mustache.render(locationMsgTemplate, {
    locationMsg,
    username,
    createdAt: moment(createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

$shareLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }
  $shareLocationBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition(position => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    socket.emit("sendLocation", { location }, () => {
      console.log("Location shared!");
      $shareLocationBtn.removeAttribute("disabled");
    });
  });
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  $sidebar.innerHTML = html;
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
  console.log("User succesfully joined the room");
});
