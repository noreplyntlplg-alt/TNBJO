// Configuration
const CONFIG = {
    LIFF_ID: "YOUR_LIFF_ID_HERE", // ใส่ LIFF ID ที่ได้จาก LINE Developers
    API_URL: "YOUR_GAS_WEB_APP_URL_HERE" // ใส่ URL ของ Web App หลัง Deploy GAS
};

let currentUserData = null;
let currentLineProfile = null;

// Initialize
window.onload = function() {
    // ถ้าต้องการเทสบน Browser ปกติโดยไม่ผ่าน LINE ให้ uncomment บรรทัดล่าง
    // mockLogin(); return; 

    initializeLiff();
};

async function initializeLiff() {
    try {
        await liff.init({ liffId: CONFIG.LIFF_ID });
        if (liff.isLoggedIn()) {
            currentLineProfile = await liff.getProfile();
            checkMember(currentLineProfile.userId);
        } else {
            liff.login();
        }
    } catch (err) {
        console.error("LIFF Init Error:", err);
        alert("ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองใหม่");
    }
}

// API Call Wrapper
async function callAPI(action, data) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: action, data: data }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' } // GAS ต้องการ text/plain
        });
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return { success: false, error: { message: "การเชื่อมต่อขัดข้อง" } };
    }
}

// Check Member Status
async function checkMember(lineUserId) {
    const res = await callAPI('getMember', { line_user_id: lineUserId });
    
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    if (res.success && res.data) {
        currentUserData = res.data;
        updateUI();
        switchView('viewHome');
    } else {
        // Not a member -> Go to register
        switchView('viewRegister');
    }
}

// Registration Submit
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('loadingOverlay').style.display = 'flex';

    const payload = {
        line_user_id: currentLineProfile.userId,
        display_name: currentLineProfile.displayName,
        profile_image: currentLineProfile.pictureUrl,
        first_name: document.getElementById('regFirstName').value,
        last_name: document.getElementById('regLastName').value,
        phone: document.getElementById('regPhone').value,
        birthday: document.getElementById('regBirthday').value
    };

    const res = await callAPI('registerMember', payload);
    if (res.success) {
        alert("สมัครสมาชิกสำเร็จ!");
        checkMember(currentLineProfile.userId); // โหลดข้อมูลใหม่เข้า Home
    } else {
        document.getElementById('loadingOverlay').style.display = 'none';
        alert("เกิดข้อผิดพลาด: " + res.error.message);
    }
});

// Update UI with User Data
function updateUI() {
    if(!currentUserData) return;
    
    document.getElementById('uiUserName').innerText = currentUserData.first_name || currentUserData.display_name;
    document.getElementById('uiUserImage').src = currentUserData.profile_image || 'https://via.placeholder.com/50';
    document.getElementById('uiMemberLevel').innerText = currentUserData.member_level;
    
    const pts = Number(currentUserData.total_points).toLocaleString();
    document.getElementById('uiTotalPoints').innerText = pts;
    
    const pointDisplays = document.querySelectorAll('.user-points-display');
    pointDisplays.forEach(el => el.innerText = pts);
    
    document.getElementById('uiMemberId').innerText = currentUserData.member_id;
}

// View Controller (Navigation)
function switchView(viewId, navElement = null) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    // Show target view
    document.getElementById(viewId).classList.add('active');

    // Update Bottom Nav Active State
    if(navElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    }
}

// QR Code Modal
function showMemberQR() {
    if(!currentUserData) return;
    
    const qrContainer = document.getElementById("qrcodeDisplay");
    qrContainer.innerHTML = ""; // Clear old QR
    
    // สร้าง QR Code จาก Member ID
    new QRCode(qrContainer, {
        text: currentUserData.member_id,
        width: 200,
        height: 200,
        colorDark : "#3E2723",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
    
    document.getElementById("qrMemberIdTxt").innerText = "ID: " + currentUserData.member_id;
    document.getElementById("qrModal").style.display = "flex";
}

function closeQRModal() {
    document.getElementById("qrModal").style.display = "none";
}

// Demo Redeem
function redeemDemo() {
    if(confirm("ยืนยันการแลกรางวัลนี้หรือไม่?")) {
        alert("ระบบจำลอง: ส่ง Request ไปที่ API redeemReward()");
    }
}

// สำหรับทดสอบบน Browser (ไม่ผ่าน LINE)
function mockLogin() {
    currentLineProfile = {
        userId: "U_MOCK_1234567890",
        displayName: "Mock User",
        pictureUrl: "https://via.placeholder.com/50"
    };
    checkMember(currentLineProfile.userId);
}
