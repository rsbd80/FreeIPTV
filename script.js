// JSON প্লেলিস্টের URL (আপনার নিজের JSON ফাইলের লিংক দিন)
const playlistUrl = "playlist.json"; // <-- এখানে আপনার JSON URL দিন

let clapprPlayer;

// 페이지 로드 시 플레이리스트 fetch
window.addEventListener('load', function() {
    fetchPlaylist();
});

// Clappr Player init
function initPlayer(url) {
    if (clapprPlayer) clapprPlayer.destroy();
    clapprPlayer = new Clappr.Player({
        source: url,
        parentId: "#player",
        width: '100%',
        height: '100%',
        autoPlay: true,
        mute: false,
        mimeType: "application/x-mpegURL"
    });
}

// JSON ফেচ করা
async function fetchPlaylist() {
    try {
        const response = await fetch(playlistUrl);
        const data = await response.json();
        parsePlaylist(data);
    } catch (error) {
        console.error("JSON Fetch Error:", error);
    }
}

// JSON পার্স ও UI রেন্ডার
function parsePlaylist(jsonData) {
    let channels = {};

    // যদি JSON-এ 'groups' অ্যারে থাকে (নতুন ফরম্যাট)
    if (jsonData.groups && Array.isArray(jsonData.groups)) {
        jsonData.groups.forEach(group => {
            channels[group.name] = group.channels.map(ch => ({
                name: ch.name,
                logo: ch.logo || "https://i.postimg.cc/VN3yWtJs/20260104-125226.png",
                url: ch.url
            }));
        });
    }
    // অথবা যদি সরাসরি group-keyed অবজেক্ট হয় (পুরানো ফরম্যাট)
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
        console.error("Invalid JSON format. Expected { groups: [...] } or { groupName: [...] }");
        return;
    }

    renderUI(channels);
}

// UI রেন্ডার (আগের মতোই)
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
        if (firstCard) firstCard.click();
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
