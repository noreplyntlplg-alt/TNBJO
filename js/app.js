// ==========================================
// TNBJO APP LOGIC (app.js)
// ==========================================
const CONFIG = {
    LIFF_ID: "YOUR_LIFF_ID", // ใส่ LIFF ID (เช่น 1234567890-AbCdEfG)
    API_URL: "YOUR_GAS_WEB_APP_URL" // ใส่ URL ของเว็บแอปที่ Deploy จาก Code.gs
};

let userProfile = null; // ข้อมูลจาก LINE
let memberData = null;  // ข้อมูลจาก Database

// 1. Initialize LIFF & App
window.onload = async () => {
    try {
        await liff.init({ liffId: CONFIG.LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            userProfile = await liff.getProfile();
            verifyMember(userProfile.userId);
        }
    } catch (err) {
        console.error(err);
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ LINE ได้', 'error');
    }
};

// 2. เรียกใช้งาน API
async function apiCall(action, data) {
    const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, data }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    return await res.json();
}

// 3. ตรวจสอบสถานะสมาชิก
async function verifyMember(lineUserId) {
    const res = await apiCall('getMember', { line_user_id: lineUserId });
    
    document.getElementById('loader').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    if (res.success) {
        memberData = res.data;
        updateUI();
        switchView('viewHome');
    } else {
        // ยังไม่ได้สมัคร
        switchView('viewRegister');
    }
}

// 4. อัปเดตข้อมูลหน้าจอ
function updateUI() {
    if(!memberData) return;
    document.getElementById('uiName').innerText = memberData.first_name || userProfile.displayName;
    document.getElementById('uiImg').src = userProfile.pictureUrl || 'https://via.placeholder.com/150';
    document.getElementById('uiPoints').innerText = Number(memberData.total_points).toLocaleString();
    document.getElementById('uiPointsReward').innerText = Number(memberData.total_points).toLocaleString();
    document.getElementById('uiID').innerText = memberData.member_id;
    document.getElementById('uiLevel').innerText = memberData.member_level;
}

// 5. สมัครสมาชิก
document.getElementById('formRegister').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    Swal.fire({ title: 'กำลังบันทึกข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const payload = {
        line_user_id: userProfile.userId,
        display_name: userProfile.displayName,
        first_name: document.getElementById('regFirst').value,
        last_name: document.getElementById('regLast').value,
        phone: document.getElementById('regPhone').value
    };

    const res = await apiCall('registerMember', payload);
    if (res.success) {
        Swal.fire('สำเร็จ', 'ยินดีต้อนรับสู่ครอบครัว TNBJO', 'success').then(() => {
            document.getElementById('loader').style.display = 'flex';
            verifyMember(userProfile.userId); // รีโหลดข้อมูลใหม่
        });
    } else {
        Swal.fire('ข้อผิดพลาด', res.message, 'error');
    }
});

// 6. เปลี่ยนหน้าจอ (Tab Navigation)
function switchView(viewId, navEl = null) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if (navEl) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navEl.classList.add('active');
    }
}

// 7. สร้าง QR Code ด้วย SweetAlert2 (พรีเมียม UI)
function openQR() {
    if(!memberData) return;
    const template = document.getElementById('qrTemplate').innerHTML;
    
    Swal.fire({
        html: template,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            new QRCode(document.getElementById("qrBox"), {
                text: memberData.member_id,
                width: 200, height: 200,
                colorDark : "#3E2723", colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
            document.getElementById('qrIdText').innerText = memberData.member_id;
        }
    });
}

// 8. ระบบจำลองการตัดแต้ม (ฝั่ง Client)
function redeem(cost, item) {
    if (Number(memberData.total_points) < cost) {
        Swal.fire('ขออภัย', 'คะแนนของคุณไม่เพียงพอ', 'warning');
        return;
    }
    
    Swal.fire({
        title: 'ยืนยันการแลกของรางวัล?',
        text: `คุณต้องการใช้ ${cost} แต้ม เพื่อแลก "${item}" ใช่หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3E2723',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('สำเร็จ!', 'โปรดนำหน้าจอนี้แสดงให้พนักงาน', 'success');
            // ในระบบจริง จะต้องเรียก apiCall('redeemReward', ...) เพื่อหักแต้มใน DB
        }
    });
}

function alertSystem() {
    Swal.fire('Coming Soon', 'ฟังก์ชันบัญชีส่วนตัวกำลังอยู่ระหว่างการพัฒนา', 'info');
}
