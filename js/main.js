(function () {
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function users() {
    try { return JSON.parse(localStorage.getItem("falconx-users") || "[]"); }
    catch (e) { return []; }
  }
  function saveUsers(list) { localStorage.setItem("falconx-users", JSON.stringify(list)); }
  function session() {
    try { return JSON.parse(localStorage.getItem("falconx-session") || "null"); }
    catch (e) { return null; }
  }
  function setSession(value) {
    if (value) localStorage.setItem("falconx-session", JSON.stringify(value));
    else localStorage.removeItem("falconx-session");
  }
  function params() { return new URLSearchParams(location.search); }

  var header = $(".site-header");
  var toggle = $(".nav-toggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  $$(".has-sub > button").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var li = btn.parentElement;
      var was = li.classList.contains("open");
      $$(".has-sub.open").forEach(function (item) {
        item.classList.remove("open");
        var other = item.querySelector("button");
        if (other) other.setAttribute("aria-expanded", "false");
      });
      if (!was) {
        li.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", function () {
    $$(".has-sub.open").forEach(function (item) {
      item.classList.remove("open");
      var other = item.querySelector("button");
      if (other) other.setAttribute("aria-expanded", "false");
    });
  });

  var langBtn = $("#lang-btn");
  var storedLang = localStorage.getItem("falconx-lang") || "English";
  if (langBtn) langBtn.firstChild.textContent = storedLang.slice(0, 2).toUpperCase() + " ";
  $$("#lang-menu a").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var name = link.getAttribute("data-lang");
      localStorage.setItem("falconx-lang", name);
      if (langBtn) langBtn.firstChild.textContent = name.slice(0, 2).toUpperCase() + " ";
      var note = $("#lang-note");
      if (!note) {
        note = document.createElement("p");
        note.id = "lang-note";
        note.className = "notice container";
        note.style.padding = "10px 0";
        var content = $("#content");
        if (content) content.parentNode.insertBefore(note, content);
      }
      note.textContent = name === "English"
        ? ""
        : "Language set to " + name + ". This demo keeps the page copy in English.";
    });
  });

  var who = session();
  var slot = $("#account-slot");
  if (who && slot) {
    slot.innerHTML = '<a class="pill" href="account.html">' + who.email.split("@")[0] + "</a>";
  }

  $$("form[data-signup]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = form.querySelector("input[type=email]");
      var error = form.querySelector(".form-error");
      var email = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (error) error.textContent = "Enter a valid email address.";
        input.focus();
        return;
      }
      location.href = "signup.html?email=" + encodeURIComponent(email);
    });
  });

  var signup = $("#signup-form");
  if (signup) {
    var emailInput = signup.querySelector("[name=email]");
    var planInput = signup.querySelector("[name=plan]");
    if (params().get("email")) emailInput.value = params().get("email");
    if (params().get("plan")) planInput.value = params().get("plan");
    var platformNames = { windows: "Windows", macos: "macOS", linux: "Linux", ios: "iPhone or iPad", android: "Android", router: "router" };
    var platformNote = $("#platform-note");
    var platform = params().get("platform");
    if (platformNote && platformNames[platform]) {
      platformNote.hidden = false;
      platformNote.textContent = "You started from the " + platformNames[platform] + " download. This form saves a demo account in this browser. It does not download an installer.";
    }
    signup.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = emailInput.value.trim().toLowerCase();
      var password = signup.querySelector("[name=password]").value;
      var plan = planInput.value;
      var box = $("#signup-msg");
      if (password.length < 8) {
        box.className = "banner warn";
        box.hidden = false;
        box.textContent = "Use at least 8 characters. This demo stores the password only in your browser.";
        return;
      }
      var list = users().filter(function (u) { return u.email !== email; });
      list.push({ email: email, password: password, plan: plan });
      saveUsers(list);
      setSession({ email: email, plan: plan });
      location.href = "account.html?welcome=1";
    });
  }

  var login = $("#login-form");
  if (login) {
    login.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = login.querySelector("[name=email]").value.trim().toLowerCase();
      var password = login.querySelector("[name=password]").value;
      var box = $("#login-msg");
      var found = users().filter(function (u) { return u.email === email && u.password === password; })[0];
      if (!found) {
        box.className = "banner warn";
        box.hidden = false;
        box.textContent = "Those details do not match an account in this browser.";
        return;
      }
      setSession({ email: found.email, plan: found.plan });
      var next = params().get("next") || "account.html";
      if (!/^[a-z0-9-]+\.html$/.test(next)) next = "account.html";
      location.href = next;
    });
  }

  var account = $("#account-app");
  if (account) {
    if (!who) {
      location.href = "login.html";
      return;
    }
    $("#hello").textContent = who.email;
    $("#plan-label").textContent = planName(who.plan);
    if (params().get("welcome")) {
      var hi = $("#welcome");
      hi.hidden = false;
      hi.textContent = "Account created. Your plan choice is saved in this browser.";
    }
    $("#logout").addEventListener("click", function () {
      setSession(null);
      location.href = "index.html";
    });
    $("#plan-switch").value = who.plan || "year2";
    $("#plan-switch").addEventListener("change", function (event) {
      var list = users().map(function (u) {
        if (u.email === who.email) u.plan = event.target.value;
        return u;
      });
      saveUsers(list);
      setSession({ email: who.email, plan: event.target.value });
      $("#plan-label").textContent = planName(event.target.value);
    });
  }

  function planName(id) {
    return { month: "1 month", year: "1 year", year2: "2 years", business: "Business", vip: "VIP" }[id] || "2 years";
  }

  $$(".faq-item button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = btn.nextElementSibling;
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
    });
  });

  var contact = $("#contact-form");
  if (contact) {
    contact.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = {
        name: contact.name.value.trim(),
        email: contact.email.value.trim(),
        topic: contact.topic.value,
        message: contact.message.value.trim()
      };
      if (!data.name || !data.message) return;
      var prev = [];
      try { prev = JSON.parse(localStorage.getItem("falconx-mail") || "[]"); } catch (e) { prev = []; }
      prev.push(data);
      localStorage.setItem("falconx-mail", JSON.stringify(prev));
      $("#contact-msg").hidden = false;
      contact.reset();
    });
  }

  var bounty = $("#bounty-form");
  if (bounty) {
    bounty.addEventListener("submit", function (event) {
      event.preventDefault();
      $("#bounty-msg").hidden = false;
      bounty.reset();
    });
  }

  var chatBtn = $(".chat-launcher");
  var chat = $("#chat-panel");
  if (chatBtn && chat) {
    chatBtn.addEventListener("click", function () { chat.hidden = false; chatBtn.hidden = true; });
    $("#chat-close").addEventListener("click", function () { chat.hidden = true; chatBtn.hidden = false; });
    $("#chat-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var input = event.target.msg;
      var text = input.value.trim();
      if (!text) return;
      addBubble(text, true);
      input.value = "";
      var reply = "A specialist would pick this up on a live desk. For this demo, browse Pricing or Support for plan and setup notes.";
      if (/price|plan|cost/i.test(text)) reply = "Personal plans are listed on the pricing page. Business seats are quoted separately.";
      else if (/windows|mac|android|ios|linux|router|download/i.test(text)) reply = "Windows and Linux clients download from this site. Android is on Google Play. macOS and iOS continue to signup.";
      else if (/shadow|protocol|wireguard/i.test(text)) reply = "Shadow Mode, OpenWeb, and WireGuard are described on the protocols page.";
      setTimeout(function () { addBubble(reply, false); }, 300);
    });
  }
  function addBubble(text, mine) {
    var div = document.createElement("div");
    div.className = "bubble" + (mine ? " me" : "");
    div.textContent = text;
    $("#chat-log").appendChild(div);
    $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
  }

  var bar = $("#cookie-bar");
  var cookieChoice = localStorage.getItem("falconx-cookies");
  if (bar && !cookieChoice) bar.hidden = false;
  function choose(value) {
    localStorage.setItem("falconx-cookies", value);
    if (bar) bar.hidden = true;
  }
  var ok = $("#cookie-ok");
  var no = $("#cookie-no");
  if (ok) ok.addEventListener("click", function () { choose("allow"); });
  if (no) no.addEventListener("click", function () { choose("decline"); });
  var settings = $("#cookie-settings");
  if (settings) settings.addEventListener("click", function (event) {
    event.preventDefault();
    if (bar) bar.hidden = false;
  });

  $$("[data-video]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $("#video-title").textContent = btn.getAttribute("data-video") || "How FalconX works";
      $("#video-modal").hidden = false;
    });
  });
  var videoClose = $("#video-close");
  if (videoClose) videoClose.addEventListener("click", function () { $("#video-modal").hidden = true; });
  var videoModal = $("#video-modal");
  if (videoModal) videoModal.addEventListener("click", function (event) {
    if (event.target === videoModal) videoModal.hidden = true;
  });

  var ipBtn = $("#ip-btn");
  if (ipBtn) {
    ipBtn.addEventListener("click", function () {
      var out = $("#ip-out");
      out.textContent = "Looking up…";
      fetch("https://api.ipify.org?format=json")
        .then(function (r) { return r.json(); })
        .then(function (data) { out.textContent = "Public address reported by the lookup service: " + data.ip; })
        .catch(function () { out.textContent = "The lookup service did not respond from this browser."; });
    });
  }
  var pass = $("#password-check");
  if (pass) {
    pass.addEventListener("input", function () {
      var value = pass.value;
      var score = 0;
      if (value.length >= 8) score += 1;
      if (value.length >= 12) score += 1;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
      if (/\d/.test(value)) score += 1;
      if (/[^A-Za-z0-9]/.test(value)) score += 1;
      var labels = ["Too short", "Weak", "Okay", "Good", "Strong", "Strong"];
      $("#meter").style.width = (score / 5 * 100) + "%";
      $("#pass-label").textContent = value ? labels[score] : "Type to check strength locally";
    });
  }

  var search = $("#review-search");
  if (search) {
    var cards = $$("[data-review]");
    search.addEventListener("input", function () {
      var q = search.value.toLowerCase();
      cards.forEach(function (card) {
        card.hidden = card.textContent.toLowerCase().indexOf(q) === -1;
      });
    });
  }

  var filterButtons = $$(".filters button");
  var platformCards = $$("[data-platform]");
  function applyFilter(key) {
    filterButtons.forEach(function (b) {
      var on = b.getAttribute("data-filter") === key;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var shown = 0;
    platformCards.forEach(function (card) {
      var hide = key !== "all" && card.getAttribute("data-platform") !== key;
      card.hidden = hide;
      if (!hide) shown += 1;
    });
    var status = $("#filter-status");
    if (status) {
      var label = key === "all" ? "all platforms" : key + (shown === 1 ? " option" : " options");
      status.textContent = "Showing " + shown + " " + label;
    }
  }
  if (filterButtons.length) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.getAttribute("data-filter"));
      });
    });
  }

  var devicePick = $("#device-pick");
  if (devicePick && platformCards.length) {
    var ua = navigator.userAgent || "";
    var detected = "android";
    if (/Android/i.test(ua)) detected = "android";
    else if (/iPhone|iPad|iPod/i.test(ua)) detected = "ios";
    else if (/Win/i.test(ua)) detected = "windows";
    else if (/Mac/i.test(ua)) detected = "macos";
    else if (/Linux/i.test(ua)) detected = "linux";
    var current = document.getElementById(detected);
    if (current) {
      var badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "This device";
      current.classList.add("is-current");
      current.insertBefore(badge, current.firstChild);
      current.parentNode.insertBefore(current, current.parentNode.firstChild);
      var deviceIcon = $("#device-icon");
      var platformIcon = current.querySelector(".plat-icon svg");
      if (deviceIcon && platformIcon) deviceIcon.replaceChildren(platformIcon.cloneNode(true));
      $("#device-kicker").textContent = "For this device";
      $("#device-name").textContent = current.getAttribute("data-label");
      $("#device-note").textContent = current.getAttribute("data-note");
      var action = $("#device-action");
      action.textContent = current.getAttribute("data-cta");
      action.setAttribute("href", current.getAttribute("data-href"));
      var fileName = current.getAttribute("data-download");
      if (fileName) action.setAttribute("download", fileName);
      else action.removeAttribute("download");
      if (current.getAttribute("data-external") === "true") {
        action.setAttribute("target", "_blank");
        action.setAttribute("rel", "noopener noreferrer");
      } else {
        action.removeAttribute("target");
        action.removeAttribute("rel");
      }
      var storeCard = platformCards.filter(function (card) { return card.getAttribute("data-external") === "true"; })[0];
      if (storeCard && detected !== storeCard.id) {
        var alt = $("#device-alt");
        alt.hidden = false;
        alt.innerHTML = 'A store build is listed for ' + storeCard.getAttribute("data-label") + '. <a href="' + storeCard.getAttribute("data-href") + '">Open that listing</a>.';
      }
    }
    var hashId = (location.hash || "").replace("#", "");
    var hashed = document.getElementById(hashId);
    if (hashed && hashed.getAttribute("data-platform")) {
      applyFilter(hashed.getAttribute("data-platform"));
      hashed.scrollIntoView();
    }
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (videoModal) videoModal.hidden = true;
      if (chat) { chat.hidden = true; if (chatBtn) chatBtn.hidden = false; }
    }
  });
})();
