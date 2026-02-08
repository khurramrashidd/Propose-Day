// ================== AWS CONFIG ==================
const REGION = "eu-north-1";
const IDENTITY_POOL_ID = "eu-north-1:cf2cfbd3-fcfe-4df2-af8d-a028afd3b20e";
const TABLE_NAME = "Proposals";

AWS.config.update({
  region: REGION,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IDENTITY_POOL_ID
  })
});

const ddb = new AWS.DynamoDB.DocumentClient();
// ===============================================

let proposals = [];
let currentDownloadProposal = null;

// Floating Hearts
function createFloatingHearts() {
  const bg = document.getElementById('hearts-bg');
  bg.innerHTML = '';
  for (let i = 0; i < 28; i++) {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = ['❤️','💖','💗','💘','💝'][Math.floor(Math.random()*5)];
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = (Math.random() * 18 + 15) + 's';
    heart.style.animationDelay = '-' + Math.random() * 20 + 's';
    heart.style.fontSize = (Math.random() * 22 + 20) + 'px';
    bg.appendChild(heart);
  }
}

// Sidebar Toggle
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('-translate-x-full');
}

// // Motivation Video
// function playMotivationVideo() {
//   window.open('https://www.youtube.com/shorts/GxGD74vWprA', '_blank');
// }
// Motivation Video Modal (New)
function playMotivationVideo() {
  document.getElementById('video-modal').classList.remove('hidden');
  // Auto play
  const iframe = document.getElementById('youtube-video');
  iframe.src = "https://www.youtube.com/embed/GxGD74vWprA?autoplay=1";
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  const iframe = document.getElementById('youtube-video');
  modal.classList.add('hidden');
  iframe.src = "https://www.youtube.com/embed/GxGD74vWprA"; // Stop video
}

// Add Proposal
async function addProposal() {
  const style = document.getElementById('style').value;
  const message = document.getElementById('message').value.trim();
  const name = document.getElementById('name').value.trim() || 'Anonymous';

  if (!message) return alert('Please write your proposal 💌');

  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      style: style,
      message: message,
      name: name,
      timestamp: Date.now(),
      likes: 0
    }
  };

  try {
    await ddb.put(params).promise();
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    document.getElementById('message').value = '';
    document.getElementById('name').value = '';
    loadProposals();
  } catch (err) {
    console.error(err);
    alert('Error sending proposal');
  }
}

// Like Proposal
async function likeProposal(id) {
  try {
    await ddb.update({
      TableName: TABLE_NAME,
      Key: { id: id },
      UpdateExpression: "ADD likes :inc",
      ExpressionAttributeValues: { ":inc": 1 }
    }).promise();
    loadProposals();
  } catch (err) { console.error(err); }
}

// Share
function shareProposal(message) {
  navigator.clipboard.writeText(`"${message}"\n\n— Shared from ProposeHub 💍`);
  alert("Proposal copied to clipboard! ❤️");
}

// Download Card
function showDownloadModal(message, name) {
  currentDownloadProposal = { message, name };
  document.getElementById('download-modal').classList.remove('hidden');
  document.getElementById('from-name').focus();
}

function closeModal() {
  document.getElementById('download-modal').classList.add('hidden');
}

async function generateAndDownloadCard() {
  const from = document.getElementById('from-name').value.trim() || "Someone Special";
  const to = document.getElementById('to-name').value.trim() || "My Love";

  const cardHTML = `
    <div class="download-card">
      <div class="download-card-content">
        <h1>To</h1>
        <p class="to">${to}</p>
        <p class="message">"${currentDownloadProposal.message}"</p>
        <p class="from">From: ${from}</p>
        <div style="margin-top:40px; font-size:13px; color:#831843;">ProposeHub • 2026</div>
      </div>
    </div>
  `;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cardHTML;
  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv.firstElementChild, { scale: 3 });
    const link = document.createElement('a');
    link.download = `Proposal_for_${to}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  } catch (e) {
    alert("Download failed. Try again.");
  }

  document.body.removeChild(tempDiv);
  closeModal();
}

// Trending - Educational Sarcastic Proposals
const trendingDummy = [
  { id: "t1", style: "funny", message: "You must be made of copper and tellurium... because you're Cu-Te. Chemistry says: Best elements make the strongest bonds.", name: "Periodic Table", likes: 142 },
  { id: "t2", style: "bold", message: "Are you a 90-degree angle? Because you're looking right. Maths fact: You're not acute, you're perfectly right.", name: "Pythagoras", likes: 118 },
  { id: "t3", style: "poetic", message: "If I were an enzyme, I'd be DNA helicase... so I could unzip your genes. Biology class approved.", name: "Bio Nerd", likes: 95 },
  { id: "t4", style: "romantic", message: "You must be a carbon sample... because I want to date you. Carbon dating is serious science.", name: "Chemist", likes: 87 },
  { id: "t5", style: "cute", message: "My love for you is like π — irrational and never-ending. Advanced Maths sarcasm.", name: "Mathematician", likes: 76 },
  { id: "t6", style: "bold", message: "According to Newton's law, I'm attracted to you... and it's definitely not just gravity.", name: "Physicist", likes: 69 }
];

function showTrending() {
  renderProposals(trendingDummy);
}

// Render Proposals
function renderProposals(data) {
  const wall = document.getElementById('wall');
  wall.innerHTML = '';

  data.forEach(item => {
    const div = document.createElement('div');
    div.className = `proposal ${item.style} p-6`;
    div.innerHTML = `
      <div class="flex justify-between items-start">
        <span class="text-4xl">${item.style === 'romantic' ? '❤️' : item.style === 'cute' ? '🥰' : item.style === 'funny' ? '😂' : item.style === 'bold' ? '🔥' : '✨'}</span>
        <button onclick="likeProposal('${item.id}')" class="like-btn text-2xl hover:scale-125">❤️ <span>${item.likes || 0}</span></button>
      </div>
      <p class="msg text-lg leading-relaxed my-5">"${item.message}"</p>
      <div class="flex justify-between items-center text-sm">
        <small class="text-gray-600">~ ${item.name}</small>
        <div class="flex gap-3">
          <button onclick="shareProposal('${item.message.replace(/'/g, "\\'")}')" class="text-rose-500 hover:text-rose-600">
            <i class="fas fa-share"></i>
          </button>
          <button onclick="showDownloadModal('${item.message.replace(/'/g, "\\'")}', '${item.name}')" 
                  class="text-rose-600 font-medium hover:underline">Download Card ↓</button>
        </div>
      </div>
    `;
    wall.appendChild(div);
  });
}

function filterProposals() {
  const term = document.getElementById('search').value.toLowerCase();
  const filtered = proposals.filter(p => 
    p.message.toLowerCase().includes(term) || p.name.toLowerCase().includes(term)
  );
  renderProposals(filtered);
}

async function loadProposals() {
  try {
    const data = await ddb.scan({ TableName: TABLE_NAME, Limit: 200 }).promise();
    proposals = data.Items.sort((a, b) => b.timestamp - a.timestamp);
    renderProposals(proposals);
  } catch (err) {
    console.error(err);
  }
}

function init() {
  createFloatingHearts();
  loadProposals();

  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
  }

  document.getElementById('sidebar-btn').addEventListener('click', toggleSidebar);
}

window.onload = init;