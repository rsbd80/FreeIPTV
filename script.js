// JSON প্লেলিস্টের URL (লোকাল ফাইলের জন্য)
const playlistUrl = "./playlist.json"; // একই ফোল্ডারে থাকলে

let clapprPlayer;

// পেজ লোড হলে JSON ফেচ করবে
window.addEventListener('load', function() {
    console.log("📡 JSON ফেচ শুরু হচ্ছে...");
    fetchPlaylist();
});

// Clappr Player ইনিশিয়ালাইজ
function initPlayer(url) {
    if (clapprPlayer) {
        clapprPlayer.destroy();
    }
    clapprPlayer = new Clappr.Player({
        source: url,
        parentId: "#player",
        width: '100%',
        height: '100%',
        autoPlay: true,
        mute: false,
        mimeType: "application/x-mpegURL"
    });
    console.log("▶️ প্লেয়ার লোড হয়েছে:", url);
}

// JSON ফেচ করা
async function fetchPlaylist() {
    try {
        const response = await fetch(playlistUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("✅ JSON ডেটা লোড হয়েছে:", data);
        parsePlaylist(data);
    } catch (error) {
        console.error("❌ JSON লোডে সমস্যা:", error);
        // ইউজারকে মেসেজ দেখাতে চাইলে
        document.getElementById('channelContainer').innerHTML = 
            `<p style="color:red; text-align:center; padding:20px;">⚠️ JSON লোড করা যায়নি। কনসোল চেক করুন।</p>`;
    }
}

// JSON পার্স ও UI রেন্ডার
function parsePlaylist(jsonData) {
    let channels = {};

    // ফরম্যাট-১: { "groups": [ { "name": "...", "channels": [...] } ] }
    if (jsonData.groups && Array.isArray(jsonData.groups)) {
        jsonData.groups.forEach(group => {
            channels[group.name] = group.channels.map(ch => ({
                name: ch.name,
                logo: ch.logo || "https://i.postimg.cc/VN3yWtJs/20260104-125226.png",
                url: ch.url
            }));
        });
    }
    // ফরম্যাট-২: { "Sports": [...], "News": [...] }
    else if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
        Object.keys(jsonData).forEach(group => {
            channels[group] = jsonData[group].map(ch => ({
                name: ch.name,
                logo: ch.logo || "https://i.postimg.cc/VN3yWtJs/20260104-125226.png",
                url: ch.url
            }));
        });
    }
    else {
        console.error("❌ ভুল JSON ফরম্যাট। 'groups' অ্যারে বা group-keyed অবজেক্ট প্রত্যাশিত।");
        return;
    }

    renderUI(channels);
}

// UI রেন্ডার (ট্যাব + চ্যানেল কার্ড)
function renderUI(data) {
    let tabHtml = '';
    let channelHtml = '';
    let first = true;

    Object.keys(data).forEach((group, index) => {
        let catId = `cat_${index}`;
        tabHtml += `<div class="tab-btn ${first ? 'active' : ''}" onclick="openTab(event, '${catId}')">${group}</div>`;
        channelHtml += `<div id="${catId}" class="channel-grid ${first ? 'active' : ''}">`;
        data[group].forEach(ch => {
            channelHtml += `
                <div class="channel-card" onclick="loadStream('${ch.url}', this)">
                    <div class="logo-wrapper">
                        <div class="inner-card">
                            <img src="${ch.logo}" onerror="this.src='https://i.postimg.cc/VN3yWtJs/20260104-125226.png'">
                        </div>
                    </div>
                    <div class="channel-name">${ch.name}</div>
                </div>`;
        });
        channelHtml += `</div>`;
        first = false;
    });

    document.getElementById('tabList').innerHTML = tabHtml;
    document.getElementById('channelContainer').innerHTML = channelHtml;

    // প্রথম চ্যানেল অটো-প্লে
    setTimeout(() => {
        const firstCard = document.querySelector('.channel-grid.active .channel-card');
        if (firstCard) {
            firstCard.click();
        }
    }, 1000);
}

// ট্যাব স্যুইচ
function openTab(evt, catId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    document.querySelectorAll('.channel-grid').forEach(g => g.classList.remove('active'));
    document.getElementById(catId).classList.add('active');
    document.getElementById('channelContainer').scrollTop = 0;
}

// স্ট্রিম লোড
function loadStream(url, el) {
    document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    initPlayer(url);
}
