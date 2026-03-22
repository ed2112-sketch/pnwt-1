export async function GET() {
  const js = `(function(){
"use strict";

var s = document.currentScript;
if (!s) return;

var cfg = {
  org: s.getAttribute("data-org") || "",
  venue: s.getAttribute("data-venue") || "",
  events: s.getAttribute("data-events") || "",
  theme: s.getAttribute("data-theme") || "dark",
  limit: parseInt(s.getAttribute("data-limit") || "6", 10),
  accent: s.getAttribute("data-accent") || "#c4a882",
  layout: s.getAttribute("data-layout") || "grid",
  showImages: s.getAttribute("data-show-images") !== "false",
  showPrices: s.getAttribute("data-show-prices") !== "false",
  showVenue: s.getAttribute("data-show-venue") !== "false",
  buttonText: s.getAttribute("data-button-text") || "Get Tickets",
  target: s.getAttribute("data-target") || "_blank",
  container: s.getAttribute("data-container") || "pnwt-widget",
  transparent: s.getAttribute("data-transparent") === "true",
  customBg: s.getAttribute("data-bg") || "",
  customCardBg: s.getAttribute("data-card-bg") || "",
  customText: s.getAttribute("data-text") || "",
  customBtnBg: s.getAttribute("data-btn-bg") || "",
  customBtnText: s.getAttribute("data-btn-text") || ""
};

if (!cfg.org) { console.error("PNWTickets Widget: data-org is required"); return; }

var origin = s.src.replace(/\\/api\\/widget\\.js.*/, "");
var apiUrl = origin + "/api/widget?org=" + encodeURIComponent(cfg.org);
if (cfg.venue) apiUrl += "&venue=" + encodeURIComponent(cfg.venue);
if (cfg.events) apiUrl += "&events=" + encodeURIComponent(cfg.events);
apiUrl += "&limit=" + cfg.limit;

var isDark = cfg.theme === "dark";
var ac = cfg.accent;

function formatDate(iso) {
  var d = new Date(iso);
  var wd = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  var mo = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  var day = d.getDate();
  var time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return wd + ", " + mo + " " + day + " \\u00b7 " + time;
}

function formatPrice(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function esc(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function css() {
  var bg = cfg.customBg || (isDark ? "#121110" : "#fafaf8");
  var bgCard = cfg.customCardBg || (isDark ? "#211f1d" : "#ffffff");
  var text = cfg.customText || (isDark ? "#f0eeeb" : "#1a1918");
  var textSec = isDark ? "#9e9a93" : "#6b6965";
  var textMuted = isDark ? "#5c5955" : "#9e9a93";
  var border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  var borderHover = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.15)";
  var shadow = isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 8px 30px rgba(0,0,0,0.08)";
  var btnBg = cfg.customBtnBg || (isDark ? text : "#1a1918");
  var btnText = cfg.customBtnText || (isDark ? "#121110" : "#ffffff");
  var inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  return ':host{display:block}*{box-sizing:border-box;margin:0;padding:0}'
  + '.pnwt-root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;background:' + bg + ';color:' + text + ';padding:24px;border-radius:16px;letter-spacing:-0.01em}'
  + '.pnwt-root.pnwt-transparent{background:transparent;padding:0;border-radius:0}'
  + '.pnwt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}'
  + '.pnwt-list{display:flex;flex-direction:column;gap:12px}'
  + '.pnwt-compact{display:flex;flex-direction:column;gap:8px}'
  + '.pnwt-card{position:relative;overflow:hidden;border-radius:12px;border:1px solid ' + border + ';background:' + bgCard + ';transition:all 0.35s cubic-bezier(0.16,1,0.3,1);text-decoration:none;color:inherit;display:block}'
  + '.pnwt-card:hover{border-color:' + borderHover + ';box-shadow:' + shadow + '}'
  + '.pnwt-card-hero{position:relative;aspect-ratio:16/9;overflow:hidden}'
  + '.pnwt-card-hero img{width:100%;height:100%;object-fit:cover;transition:transform 0.6s ease}'
  + '.pnwt-card:hover .pnwt-card-hero img{transform:scale(1.04)}'
  + '.pnwt-card-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,' + bg + ',' + bg + 'aa 30%,transparent 70%)}'
  + '.pnwt-card-hero-noimg{width:100%;aspect-ratio:16/9;background:' + bgCard + '}'
  + '.pnwt-card-content{padding:16px 20px 20px}'
  + '.pnwt-date{font-size:10px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:' + ac + ';margin-bottom:6px}'
  + '.pnwt-title{font-size:18px;font-weight:600;line-height:1.25;color:' + text + ';margin-bottom:3px}'
  + '.pnwt-venue{font-size:13px;color:' + textMuted + ';margin-bottom:10px}'
  + '.pnwt-price{font-size:13px;font-weight:500;color:' + textSec + '}'
  + '.pnwt-soldout{font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#e5484d;background:rgba(229,72,77,0.1);border:1px solid rgba(229,72,77,0.15);padding:3px 10px;border-radius:100px;display:inline-block}'

  /* Ticket selector */
  + '.pnwt-tickets{margin-top:12px;border-top:1px solid ' + border + ';padding-top:12px}'
  + '.pnwt-ticket-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;gap:12px}'
  + '.pnwt-ticket-row+.pnwt-ticket-row{border-top:1px solid ' + border + '}'
  + '.pnwt-ticket-info{flex:1;min-width:0}'
  + '.pnwt-ticket-name{font-size:13px;font-weight:500;color:' + text + '}'
  + '.pnwt-ticket-price{font-size:12px;color:' + textSec + '}'
  + '.pnwt-ticket-remaining{font-size:10px;color:' + textMuted + '}'
  + '.pnwt-qty{display:flex;align-items:center;gap:0}'
  + '.pnwt-qty button{width:28px;height:28px;border-radius:50%;border:1px solid ' + border + ';background:transparent;color:' + text + ';cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.15s}'
  + '.pnwt-qty button:hover{border-color:' + borderHover + ';background:' + inputBg + '}'
  + '.pnwt-qty button:disabled{opacity:0.3;cursor:not-allowed}'
  + '.pnwt-qty span{width:32px;text-align:center;font-size:14px;font-weight:600;color:' + text + '}'

  /* Checkout bar */
  + '.pnwt-checkout{margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px}'
  + '.pnwt-checkout-total{font-size:15px;font-weight:600;color:' + text + '}'
  + '.pnwt-btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 20px;border-radius:100px;font-size:13px;font-weight:500;background:' + btnBg + ';color:' + btnText + ';border:none;cursor:pointer;text-decoration:none;transition:all 0.2s ease}'
  + '.pnwt-btn:hover{opacity:0.85;transform:translateY(-1px)}'
  + '.pnwt-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}'
  + '.pnwt-btn-sm{padding:8px 16px;font-size:12px}'

  /* Footer */
  + '.pnwt-footer{text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid ' + border + '}'
  + '.pnwt-footer a{font-size:11px;color:' + textMuted + ';text-decoration:none;letter-spacing:0.05em}'
  + '.pnwt-footer a:hover{color:' + textSec + '}'
  + '.pnwt-loading,.pnwt-empty{text-align:center;padding:40px;color:' + textMuted + ';font-size:14px}'

  /* Modal */
  + '.pnwt-modal-overlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s}'
  + '.pnwt-modal-overlay.visible{opacity:1}'
  + '.pnwt-modal-frame{width:90vw;max-width:900px;height:85vh;border-radius:16px;overflow:hidden;background:' + bg + ';border:1px solid ' + border + ';box-shadow:0 40px 100px rgba(0,0,0,0.5);transform:scale(0.95);transition:transform 0.3s cubic-bezier(0.16,1,0.3,1)}'
  + '.pnwt-modal-overlay.visible .pnwt-modal-frame{transform:scale(1)}'
  + '.pnwt-modal-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.5);color:white;border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:10}'
  + '.pnwt-modal-close:hover{background:rgba(0,0,0,0.7)}'
  + '.pnwt-modal-iframe{width:100%;height:100%;border:none}'

  /* Fade */
  + '.pnwt-fade{opacity:0;animation:pnwtFade 0.4s ease-out forwards}'
  + '.pnwt-fade-1{animation-delay:0.05s}.pnwt-fade-2{animation-delay:0.1s}.pnwt-fade-3{animation-delay:0.15s}.pnwt-fade-4{animation-delay:0.2s}.pnwt-fade-5{animation-delay:0.25s}'
  + '@keyframes pnwtFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
}

function renderCard(ev, i, baseUrl, shadow) {
  var card = document.createElement("div");
  card.className = "pnwt-card pnwt-fade pnwt-fade-" + Math.min(i, 5);

  var dateStr = formatDate(ev.startDate);
  var url = baseUrl + "/e/" + ev.slug;
  var venueHtml = cfg.showVenue ? '<div class="pnwt-venue">' + esc(ev.venue.name) + '</div>' : '';

  // Hero image
  var heroHtml = '';
  if (cfg.showImages && cfg.layout !== "compact") {
    if (ev.imageUrl) {
      heroHtml = '<div class="pnwt-card-hero"><img src="' + esc(ev.imageUrl) + '" alt="' + esc(ev.title) + '" loading="lazy" /><div class="pnwt-card-hero-overlay"></div></div>';
    } else {
      heroHtml = '<div class="pnwt-card-hero-noimg"></div>';
    }
  }

  // Price line
  var priceHtml = '';
  if (ev.soldOut) {
    priceHtml = '<span class="pnwt-soldout">Sold Out</span>';
  } else if (ev.minPrice !== null && cfg.showPrices) {
    priceHtml = '<span class="pnwt-price">From ' + formatPrice(ev.minPrice) + '</span>';
  }

  // Ticket selector
  var ticketsHtml = '';
  if (ev.ticketTypes && ev.ticketTypes.length > 0 && !ev.soldOut) {
    ticketsHtml = '<div class="pnwt-tickets">';
    ev.ticketTypes.forEach(function(tt) {
      var soldOut = tt.remaining <= 0;
      ticketsHtml += '<div class="pnwt-ticket-row" data-tt-id="' + tt.id + '">'
        + '<div class="pnwt-ticket-info">'
        + '<div class="pnwt-ticket-name">' + esc(tt.name) + '</div>'
        + '<div class="pnwt-ticket-price">' + formatPrice(tt.price) + (soldOut ? ' \\u00b7 <span style="color:#e5484d">Sold out</span>' : '') + '</div>'
        + '</div>';
      if (!soldOut) {
        ticketsHtml += '<div class="pnwt-qty">'
          + '<button class="pnwt-qty-minus" data-tt="' + tt.id + '" disabled>\\u2212</button>'
          + '<span class="pnwt-qty-val" data-tt="' + tt.id + '">0</span>'
          + '<button class="pnwt-qty-plus" data-tt="' + tt.id + '" data-max="' + Math.min(tt.remaining, 10) + '">+</button>'
          + '</div>';
      }
      ticketsHtml += '</div>';
    });
    ticketsHtml += '<div class="pnwt-checkout" style="display:none" data-event="' + esc(ev.slug) + '">'
      + '<span class="pnwt-checkout-total" data-total></span>'
      + '<button class="pnwt-btn pnwt-btn-sm pnwt-checkout-btn" data-slug="' + esc(ev.slug) + '">' + esc(cfg.buttonText) + '</button>'
      + '</div>';
    ticketsHtml += '</div>';
  }

  card.innerHTML = heroHtml
    + '<div class="pnwt-card-content">'
    + '<div class="pnwt-date">' + esc(dateStr) + '</div>'
    + '<div class="pnwt-title">' + esc(ev.title) + '</div>'
    + venueHtml
    + priceHtml
    + ticketsHtml
    + '</div>';

  // Wire up quantity controls
  var quantities = {};
  ev.ticketTypes.forEach(function(tt) { quantities[tt.id] = 0; });

  function updateCheckout() {
    var total = 0;
    var hasItems = false;
    ev.ticketTypes.forEach(function(tt) {
      if (quantities[tt.id] > 0) {
        total += tt.price * quantities[tt.id];
        hasItems = true;
      }
    });
    var checkoutBar = card.querySelector('.pnwt-checkout');
    if (checkoutBar) {
      checkoutBar.style.display = hasItems ? 'flex' : 'none';
      var totalEl = checkoutBar.querySelector('[data-total]');
      if (totalEl) totalEl.textContent = formatPrice(total);
    }
  }

  card.querySelectorAll('.pnwt-qty-plus').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var ttId = btn.getAttribute('data-tt');
      var max = parseInt(btn.getAttribute('data-max') || '10');
      if (quantities[ttId] < max) {
        quantities[ttId]++;
        card.querySelector('.pnwt-qty-val[data-tt="' + ttId + '"]').textContent = quantities[ttId];
        card.querySelector('.pnwt-qty-minus[data-tt="' + ttId + '"]').disabled = false;
        if (quantities[ttId] >= max) btn.disabled = true;
        updateCheckout();
      }
    });
  });

  card.querySelectorAll('.pnwt-qty-minus').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var ttId = btn.getAttribute('data-tt');
      if (quantities[ttId] > 0) {
        quantities[ttId]--;
        card.querySelector('.pnwt-qty-val[data-tt="' + ttId + '"]').textContent = quantities[ttId];
        if (quantities[ttId] <= 0) btn.disabled = true;
        card.querySelector('.pnwt-qty-plus[data-tt="' + ttId + '"]').disabled = false;
        updateCheckout();
      }
    });
  });

  // Checkout button — build cart and go to checkout
  var checkoutBtn = card.querySelector('.pnwt-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var items = [];
      ev.ticketTypes.forEach(function(tt) {
        if (quantities[tt.id] > 0) {
          items.push({ ticketTypeId: tt.id, name: tt.name, quantity: quantities[tt.id], unitPrice: tt.price });
        }
      });
      if (items.length === 0) return;

      var cart = {
        eventId: ev.slug,
        eventSlug: ev.slug,
        eventTitle: ev.title,
        items: items
      };

      // Store cart — use postMessage to parent or open checkout with cart in URL
      var cartJson = JSON.stringify(cart);
      var checkoutUrl = baseUrl + "/checkout?widget_cart=" + encodeURIComponent(cartJson);

      if (cfg.target === "modal") {
        openModal(checkoutUrl, shadow);
      } else {
        window.open(checkoutUrl, cfg.target);
      }
    });
  }

  return card;
}

function openModal(url, shadow) {
  var overlay = document.createElement("div");
  overlay.className = "pnwt-modal-overlay";
  overlay.innerHTML = '<div class="pnwt-modal-frame"><button class="pnwt-modal-close">\\u2715</button><iframe class="pnwt-modal-iframe" src="' + url + '"></iframe></div>';
  shadow.appendChild(overlay);
  requestAnimationFrame(function() { overlay.classList.add("visible"); });
  function close() {
    overlay.classList.remove("visible");
    setTimeout(function() { overlay.remove(); }, 300);
  }
  overlay.querySelector(".pnwt-modal-close").addEventListener("click", close);
  overlay.addEventListener("click", function(e) { if (e.target === overlay) close(); });
}

// Init
var container = document.getElementById(cfg.container);
if (!container) {
  container = document.createElement("div");
  container.id = cfg.container;
  s.parentNode.insertBefore(container, s);
}

var shadow = container.attachShadow({ mode: "open" });
var style = document.createElement("style");
style.textContent = css();
shadow.appendChild(style);

var root = document.createElement("div");
root.className = "pnwt-root" + (cfg.transparent ? " pnwt-transparent" : "");
root.innerHTML = '<div class="pnwt-loading">Loading events...</div>';
shadow.appendChild(root);

fetch(apiUrl)
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (!data.events || data.events.length === 0) {
      root.innerHTML = '<div class="pnwt-empty">No upcoming events</div>';
      return;
    }

    var layoutClass = cfg.layout === "list" ? "pnwt-list" : cfg.layout === "compact" ? "pnwt-compact" : "pnwt-grid";
    var grid = document.createElement("div");
    grid.className = layoutClass;

    data.events.forEach(function(ev, i) {
      grid.appendChild(renderCard(ev, i, data.baseUrl, shadow));
    });

    root.innerHTML = '';
    root.appendChild(grid);

    var footer = document.createElement("div");
    footer.className = "pnwt-footer";
    footer.innerHTML = '<a href="' + data.baseUrl + '" target="_blank">Powered by PNWTickets</a>';
    root.appendChild(footer);
  })
  .catch(function(err) {
    root.innerHTML = '<div class="pnwt-empty">Unable to load events</div>';
    console.error("PNWTickets Widget Error:", err);
  });

})();`;

  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
