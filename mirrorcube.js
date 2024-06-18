document.addEventListener('DOMContentLoaded', function() {
  const div = document.getElementById('mirrorcube');
  if (div) {
    div.innerHTML = '<p>Hello World!</p>';
  } else {
    console.error('Element with ID "mirrorcube" not found');
  }
});
