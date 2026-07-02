
(function(){
  const STORAGE_KEY = 'pvcet_student_registrations';

  const form = document.getElementById('regForm');
  const toast = document.getElementById('successToast');
  const ledgerBody = document.getElementById('ledgerBody');
  const countTag = document.getElementById('countTag');

  const fields = ['fullName','email','mobile','dob','address'];

  function setError(fieldId, msg){
    const errEl = document.getElementById('err-' + fieldId);
    const wrapper = document.getElementById(fieldId) ? document.getElementById(fieldId).closest('.field') : null;
    if(errEl) errEl.textContent = msg;
    if(wrapper){
      if(msg) wrapper.classList.add('invalid'); else wrapper.classList.remove('invalid');
    }
  }

  function calcAge(dobStr){
    const dob = new Date(dobStr);
    if(isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if(m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  function validate(){
    let valid = true;

    // Full name
    const fullName = document.getElementById('fullName').value.trim();
    if(!fullName){ setError('fullName','Full name is required.'); valid = false; }
    else { setError('fullName',''); }

    // Email
    const email = document.getElementById('email').value.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!email){ setError('email','Email is required.'); valid = false; }
    else if(!emailRe.test(email)){ setError('email','Enter a valid email address.'); valid = false; }
    else { setError('email',''); }

    // Mobile
    const mobile = document.getElementById('mobile').value.trim();
    const mobileRe = /^[0-9]{10}$/;
    if(!mobile){ setError('mobile','Mobile number is required.'); valid = false; }
    else if(!mobileRe.test(mobile)){ setError('mobile','Enter exactly 10 digits.'); valid = false; }
    else { setError('mobile',''); }

    // DOB / age
    const dob = document.getElementById('dob').value;
    let age = null;
    if(!dob){ setError('dob','Date of birth is required.'); valid = false; }
    else{
      age = calcAge(dob);
      if(age === null){ setError('dob','Enter a valid date.'); valid = false; }
      else if(age <= 18){ setError('dob','Age must be greater than 18 to register.'); valid = false; }
      else { setError('dob',''); }
    }

    // Gender
    const gender = form.querySelector('input[name="gender"]:checked');
    if(!gender){ setError('gender','Please select a gender.'); valid = false; }
    else { setError('gender',''); }

    // Department
    const department = document.getElementById('department').value;
    if(!department){ setError('department','Please select a department.'); valid = false; }
    else { setError('department',''); }

    // Course
    const course = document.getElementById('course').value;
    if(!course){ setError('course','Please select a course.'); valid = false; }
    else { setError('course',''); }

    // Address
    const address = document.getElementById('address').value.trim();
    if(!address){ setError('address','Address is required.'); valid = false; }
    else { setError('address',''); }

    return { valid, age };
  }

  function getStudents(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }

  function saveStudents(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderLedger(){
    const students = getStudents();
    countTag.textContent = students.length + (students.length === 1 ? ' entry' : ' entries');

    if(students.length === 0){
      ledgerBody.innerHTML = '<tr class="empty-row"><td colspan="10">No students registered yet — submit the form above to add the first entry.</td></tr>';
      return;
    }

    ledgerBody.innerHTML = students.map((s, i) => {
      const skillsHtml = (s.skills && s.skills.length)
        ? s.skills.map(sk => '<span class="skills-pill">' + escapeHtml(sk) + '</span>').join('')
        : '<span class="mono" style="color:#9AA1B4;">—</span>';
      return '<tr>' +
        '<td class="num">' + (i+1) + '</td>' +
        '<td>' + escapeHtml(s.fullName) + '</td>' +
        '<td>' + escapeHtml(s.department) + '</td>' +
        '<td><span class="pill">' + escapeHtml(s.course) + '</span></td>' +
        '<td>' + escapeHtml(s.gender) + '</td>' +
        '<td class="num">' + escapeHtml(s.mobile) + '</td>' +
        '<td>' + escapeHtml(s.email) + '</td>' +
        '<td>' + skillsHtml + '</td>' +
        '<td class="num">' + s.age + '</td>' +
        '<td><button type="button" class="del-btn" data-index="' + i + '">Remove</button></td>' +
      '</tr>';
    }).join('');
  }

  ledgerBody.addEventListener('click', function(e){
    if(e.target.classList.contains('del-btn')){
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      const students = getStudents();
      students.splice(idx, 1);
      saveStudents(students);
      renderLedger();
    }
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const { valid, age } = validate();
    if(!valid){
      toast.classList.remove('show');
      const firstInvalid = form.querySelector('.invalid input, .invalid select, .invalid textarea, fieldset.invalid');
      if(firstInvalid) firstInvalid.focus();
      return;
    }

    const skillNodes = form.querySelectorAll('input[name="skills"]:checked');
    const skills = Array.from(skillNodes).map(n => n.value);

    const student = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      mobile: document.getElementById('mobile').value.trim(),
      dob: document.getElementById('dob').value,
      age: age,
      gender: form.querySelector('input[name="gender"]:checked').value,
      department: document.getElementById('department').value,
      course: document.getElementById('course').value,
      skills: skills,
      address: document.getElementById('address').value.trim(),
      registeredAt: new Date().toISOString()
    };

    const students = getStudents();
    students.push(student);
    saveStudents(students);
    renderLedger();

    form.reset();
    fields.forEach(f => setError(f, ''));
    setError('gender','');
    setError('department','');
    setError('course','');

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);

    document.getElementById('ledger').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('resetBtn').addEventListener('click', function(){
    fields.forEach(f => setError(f, ''));
    setError('gender','');
    setError('department','');
    setError('course','');
    toast.classList.remove('show');
  });

  // Restrict mobile field to digits only, live
  document.getElementById('mobile').addEventListener('input', function(){
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
  });

  renderLedger();
})();
