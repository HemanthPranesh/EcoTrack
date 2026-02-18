let userId = null;

async function createUser() {
  const name = document.getElementById("username").value;

  if (!name) {
    alert("Please enter your name");
    return;
  }

  const response = await fetch("/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  const data = await response.json();
  userId = data.userId;

  // Hide login card
  document.getElementById("loginCard").style.display = "none";

  // Show dashboard
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("welcome").innerText = "Welcome " + name;

  loadUser();
  loadLeaderboard();
  loadCommunity();
}
async function register() {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const region = document.getElementById("regRegion").value;

  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, region })
  });

  const data = await response.json();

  if (response.ok) {
    alert("Registered successfully! Now login.");
  } else {
    alert(data.error);
  }
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const user = await response.json();

  if (!response.ok) {
    alert("Invalid credentials");
    return;
  }

  userId = user.id;
  currentRegion = user.region;

  document.getElementById("loginCard").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("welcome").innerText =
    "Welcome " + user.name + " (" + user.region + ")";

  loadUser();
  loadLeaderboard();
  loadCommunity();
}


async function addAction(actionType, value) {
  await fetch("/add-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: userId,
      actionType: actionType,
      carbonValue: value
    })
  });

  loadUser();
  loadLeaderboard();
  loadCommunity();
}

async function loadUser() {
  const response = await fetch(`/user/${userId}`);
  const user = await response.json();

  document.getElementById("carbon").innerText = user.totalCarbon;
  document.getElementById("actions").innerText = user.totalActions;

  // Trees equivalent
  document.getElementById("trees").innerText =
    (user.totalCarbon / 10).toFixed(1);

  // Level logic
  let level = "Eco Starter";
  let progress = 0;

  if (user.totalCarbon >= 100) {
    level = "Planet Guardian";
    progress = 100;
  } else if (user.totalCarbon >= 50) {
    level = "Climate Hero";
    progress = ((user.totalCarbon - 50) / 50) * 100;
  } else if (user.totalCarbon >= 10) {
    level = "Green Warrior";
    progress = ((user.totalCarbon - 10) / 40) * 100;
  } else {
    progress = (user.totalCarbon / 10) * 100;
  }

  document.getElementById("level").innerText = level;
  document.getElementById("progressBar").style.width = progress + "%";
}

async function loadLeaderboard() {
  const response = await fetch(`/leaderboard/${currentRegion}`);
  const users = await response.json();

  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  users.forEach((user, index) => {
    let crown = index === 0 ? "👑 " : "";
    const li = document.createElement("li");
    li.innerText = `${crown}${index + 1}. ${user.name} - ${user.totalCarbon} kg`;

    if (user.id === userId) {
      li.style.fontWeight = "bold";
      li.style.color = "#2ecc71";
    }

    list.appendChild(li);
  });
}


async function loadCommunity() {
  const response = await fetch("/community-total");
  const data = await response.json();

  document.getElementById("community").innerText =
    data.total ? data.total : 0;
}
