// Login logic
document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if(!username || !password){
    alert('Please fill in all fields.');
    return;
  }
  // Create basic local account (demo)
  localStorage.setItem('rmb_user_'+username, JSON.stringify({user:username, pass:password}));
  sessionStorage.setItem('rmb_session', username);
  alert('Welcome ' + username + '! Redirecting to dashboard...');
  window.location.href = 'game.html';
});

// Create account link
document.getElementById('createAccount').addEventListener('click', function(e){
  e.preventDefault();
  const u = prompt('Choose a username:');
  if(!u) return;
  const p = prompt('Choose a password (min 6 chars):');
  if(!p || p.length<6){ alert('Password too short'); return; }
  localStorage.setItem('rmb_user_'+u, JSON.stringify({user:u,pass:p}));
  alert('Account created. You can now login.');
});

// Guest
document.getElementById('guest').addEventListener('click', function(e){
  e.preventDefault();
  const guest = 'guest_' + Math.floor(Math.random()*9000+1000);
  sessionStorage.setItem('rmb_session', guest);
  alert('Continuing as ' + guest);
  window.location.href = 'game.html';
});
