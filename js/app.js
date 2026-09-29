// ==========================================
// TNBJO APP LOGIC (app.js) - FULL & FIXED VERSION
// ==========================================

const CONFIG = {
    LIFF_ID: "2011791349-cKlWurTV", // ใส่ LIFF ID ที่ได้จาก LINE Developers (เช่น 1234567890-AbCdEfGh)
    API_URL: "https://script.google.com/macros/s/AKfycbyVRqZvi_FvC7g6TkaqPtFO9wovgc9_xy1jcKCsz_o2GzZs8VVrlCmsSYsr51fkqj-b/exec" // ใส่ URL Web App ที่ได้จาก Google Apps Script
};

let userProfile = null;
let memberData = null;

// ฟังก์ชันสำหรับซ่อนหน้า Loading อย่างปลอดภัย
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
    const app = document.getElementById('app');
    if (app) app.style.display = 'block';
}

// 1. Initialize LIFF & App
window.onload = async () => {
    try {
        if (!CONFIG.LIFF_ID || CONFIG.LIFF_ID === "YOUR_LIFF_ID") {
            throw new Error("ยังไม่ได้ระบุ LIFF_ID ในระบบ กรุณาติดต่อนักพัฒนา");
        }

        await liff.init({ liffId: CONFIG.LIFF_ID });

        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        userProfile = await liff.getProfile();
        await verifyMember(userProfile.userId);

    } catch (err) {
        console.error("LIFF Init Error:", err);
        hideLoader();
        
        Swal.fire({
            icon: 'error',
            title: 'เชื่อมต่อระบบไม่สำเร็จ',
            text: err.message || 'กรุณาตรวจสอบการตั้งค่า LIFF ID หรืออินเทอร์เน็ตของคุณ',
            confirmButtonColor: '#3E2723'
        });
    }
};

// 2. ฟังก์ชันเรียกใช้งาน API (ปลอดภัยด้วย try...catch)
async function apiCall(action, data) {
    try {
        if (!CONFIG.API_URL || CONFIG.API_URL === "YOUR_GAS_WEB_APP_URL") {
            throw new Error("ยังไม่ได้ระบุ API_URL ในระบบ กรุณาติดต่อนักพัฒนา");
        }

        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: action, data: data }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
        }
        
        return await res.json();
    } catch (error) {
        console.error("API Error:", error);
        return { success: false, message: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้" };
    }
}

// 3. ตรวจสอบสถานะสมาชิกจาก Database
async function verifyMember(lineUserId) {
    try {
        const res = await apiCall('getMember', { line_user_id: lineUserId });

        hideLoader(); // ปิด Loader ทันทีเมื่อ API ตอบกลับมา

        if (res.success) {
            memberData = res.data;
            updateUI();
            switchView('viewHome');
        } else if (res.message === "NOT_FOUND") {
            switchView('viewRegister');
        } else {
            Swal.fire('แจ้งเตือนจากระบบ', res.message, 'warning');
            switchView('viewRegister');
        }
    } catch (err) {
        hideLoader();
        Swal.fire('การเชื่อมต่อล้มเหลว', err.message, 'error');
    }
}

// 4. อัปเดตข้อมูลบนหน้าจอแอป
function updateUI() {
    if (!memberData) return;
    
    // อัปเดตข้อมูลทั่วไป
    const uiName = document.getElementById('uiName');
    if (uiName) uiName.innerText = memberData.first_name || userProfile.displayName;
    
    const uiImg = document.getElementById('uiImg');
    if (uiImg) uiImg.src = userProfile.pictureUrl || 'https://via.placeholder.com/150';
    
    // อัปเดตคะแนน
    const pointsFormatted = Number(memberData.total_points || 0).toLocaleString();
    const uiPoints = document.getElementById('uiPoints');
    if (uiPoints) uiPoints.innerText = pointsFormatted;
    
    const uiPointsReward = document.getElementById('uiPointsReward');
    if (uiPointsReward) uiPointsReward.innerText = pointsFormatted;
    
    // อัปเดตข้อมูลบัตรสมาชิก
    const uiID = document.getElementById('uiID');
    if (uiID) uiID.innerText = memberData.member_id;
    
    const uiLevel = document.getElementById('uiLevel');
    if (uiLevel) uiLevel.innerText = memberData.member_level || 'JO MEMBER';
}

// 5. จัดการการลงทะเบียนสมาชิกใหม่
const formRegister = document.getElementById('formRegister');
if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        Swal.fire({ 
            title: 'กำลังบันทึกข้อมูล...', 
            allowOutsideClick: false, 
            didOpen: () => Swal.showLoading() 
        });

        const payload = {
            line_user_id: userProfile.userId,
            display_name: userProfile.displayName,
            first_name: document.getElementById('regFirst').value,
            last_name: document.getElementById('regLast').value,
            phone: document.getElementById('regPhone').value
        };

        const res = await apiCall('registerMember', payload);
        
        if (res.success) {
            Swal.fire('สำเร็จ', 'ลงทะเบียนสมาชิกเรียบร้อยแล้ว ยินดีต้อนรับสู่ TNBJO', 'success').then(() => {
                const loader = document.getElementById('loader');
                if (loader) loader.style.display = 'flex'; // เปิด loader อีกครั้งระหว่างโหลดข้อมูลใหม่
                verifyMember(userProfile.userId);
            });
        } else {
            Swal.fire('เกิดข้อผิดพลาด', res.message, 'error');
        }
    });
}

// 6. ระบบ Navigation (สลับหน้าจอ)
function switchView(viewId, navEl = null) {
    // ซ่อนทุกหน้า
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    
    // แสดงหน้าที่ต้องการ
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
    
    // จัดการแถบเมนูด้านล่าง
    if (navEl) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navEl.classList.add('active');
    }
}

// 7. สร้าง QR Code บัตรสมาชิก
function openQR() {
    if (!memberData) return;
    
    const templateElement = document.getElementById('qrTemplate');
    if (!templateElement) return;
    
    const template = templateElement.innerHTML;
    
    Swal.fire({
        html: template,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            // สร้าง QR Code ภายในกล่อง
            new QRCode(document.getElementById("qrBox"), {
                text: memberData.member_id,
                width: 200, 
                height: 200,
                colorDark : "#3E2723", 
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
            // แสดงรหัสสมาชิกใต้ QR Code
            document.getElementById('qrIdText').innerText = memberData.member_id;
        }
    });
}

// 8. ฟังก์ชันจำลองการแลกของรางวัล (Client-side confirmation)
function redeem(cost, item) {
    if (Number(memberData.total_points || 0) < cost) {
        Swal.fire('ขออภัย', 'คะแนนสะสมของคุณไม่เพียงพอสำหรับการแลกรางวัลนี้', 'warning');
        return;
    }
    
    Swal.fire({
        title: 'ยืนยันการแลกของรางวัล?',
        text: `คุณต้องการใช้ ${cost} JO Point เพื่อแลก "${item}" ใช่หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#C5A059', // สีทอง
        cancelButtonColor: '#757575', // สีเทา
        confirmButtonText: 'ยืนยันการแลก',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('สำเร็จ!', 'แลกรางวัลเรียบร้อยแล้ว โปรดนำหน้าจอนี้แสดงให้พนักงาน', 'success');
            // หมายเหตุ: ในระบบจริง จะต้องเรียก apiCall('redeemReward', payload) เพื่อหักคะแนนในฐานข้อมูล
        }
    });
}

// 9. แจ้งเตือนเมนูที่กำลังพัฒนา
function alertSystem() {
    Swal.fire('เร็วๆ นี้', 'ฟังก์ชันนี้กำลังอยู่ระหว่างการพัฒนา', 'info');
}
