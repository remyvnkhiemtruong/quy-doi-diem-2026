/* ==============================================================
   ENHANCEMENTS JS (100 Features Upgrade)
   ============================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Toast Notification System
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);

  window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Override alert or show custom toasts for validation
  // We'll hook into scoreInput later if needed, but for now we expose showToast.

  // 2. Scroll Progress Bar
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
  });

  // 3. Custom Cursor
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor desktop-only';
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  document.querySelectorAll('button, input, a').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });

  // 4. Ripple Effect
  document.querySelectorAll('button, .tab-btn, .subject-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // 5. Sticky Header Shrink
  const header = document.querySelector('header.letterhead');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('shrink');
    } else {
      header.classList.remove('shrink');
    }
  });

  // 6. Back to Top Button
  const backToTop = document.createElement('button');
  backToTop.id = 'back-to-top';
  backToTop.innerHTML = '↑';
  backToTop.setAttribute('aria-label', 'Cuộn lên đầu trang');
  document.body.appendChild(backToTop);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 7. Easter Egg (10diemtoan)
  let keys = '';
  document.addEventListener('keydown', (e) => {
    keys += e.key.toLowerCase();
    if (keys.length > 20) keys = keys.slice(-20);
    if (keys.includes('10diemtoan')) {
      showToast('🎉 Chúc mừng bạn đã tìm ra Easter Egg! Chúc bạn đạt điểm cao!', 'info');
      fireConfetti();
      keys = '';
    }
  });

  // 8. History Panel
  const historyPanel = document.createElement('div');
  historyPanel.className = 'history-panel desktop-only';
  historyPanel.innerHTML = `
    <button class="history-toggle">🕒</button>
    <h3 style="margin-top:0; color:var(--ink)">Lịch sử tra cứu</h3>
    <ul id="history-list" style="list-style:none; padding:0; margin:0; font-size:13px; color:var(--ink-soft);">
      <li>Chưa có dữ liệu</li>
    </ul>
  `;
  document.body.appendChild(historyPanel);

  const historyToggle = historyPanel.querySelector('.history-toggle');
  historyToggle.addEventListener('click', () => {
    historyPanel.classList.toggle('open');
  });

  window.addToHistory = function(text) {
    const list = document.getElementById('history-list');
    if (list.innerHTML.includes('Chưa có dữ liệu')) list.innerHTML = '';
    const li = document.createElement('li');
    li.style.padding = '8px 0';
    li.style.borderBottom = '1px solid var(--line)';
    li.textContent = text;
    list.insertBefore(li, list.firstChild);
    if (list.children.length > 5) {
      list.removeChild(list.lastChild);
    }
  };

  // 9. Simple Confetti
  function fireConfetti() {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 2,
        dx: Math.random() * 4 - 2,
        dy: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < canvas.height) active = true;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      if (active) requestAnimationFrame(animate);
      else canvas.remove();
    }
    animate();
  }

  // Bind Text-to-Speech to output
  window.speakResult = function(text) {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      window.speechSynthesis.speak(msg);
    }
  };

  // Apply gradient text to header
  const title = document.querySelector('h1');
  if (title) title.classList.add('gradient-text');

});
