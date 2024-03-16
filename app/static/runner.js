import { Renderer } from './renderer.js'


function load_model(model_url, callback) {
  const xhr = new XMLHttpRequest();
  document.getElementById('shape-name').innerHTML = 'Loading...';

  // Configure it: GET-request to the URL /example/data
  xhr.open('GET', model_url + '#' + Date.now(), true);

  // Setup a function to handle the response
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // Parse the JSON response
      var model = JSON.parse(xhr.responseText);
      // Log or use the response data
      
      callback(model);
    }
  };
  // Send the request
  xhr.send();
}

function locate_url_for_name(model_name) {
  return `/model?model_name=${model_name}`
}
function load_and_set_model(model_name) {

  if (window.interval_id) {
    window.clearInterval(window.interval_id);
  }
  console.log(window.spinner_model);
  console.log('spin');
  const shape_name = document.getElementById('shape-name');
  shape_name.innerHTML = 'Loading...';
  if (window.renderer) {
    window.renderer.set_model(window.spinner_model);
    window.renderer.set_spinning_speed(.35);
    
  } else {
    window.renderer = new Renderer(window.spinner_model,.35,'black', 5);
  }
  window.renderer.init_and_draw();
  load_model(locate_url_for_name(model_name),
    (model) => {
      if (window.renderer) {
        console.log('WR');
        console.log(model);
        window.renderer.set_model(model);
        window.renderer.set_spinning_speed(0);
        window.renderer.init_and_draw();
      } else {
        console.log('NWR');
        window.renderer.init_and_draw();
      }
      console.log('shape');
      shape_name.innerHTML = model_name
    })
};



function setup(spinner_model) {
  window.spinner_model = spinner_model;
  const select = document.getElementById('model-select');
  const first_model = window.first_model || document.getElementsByClassName('select-option')[0].value;
  select.addEventListener('change' ,(event) => {
        
        load_and_set_model(select.value);

  });
  load_and_set_model(first_model);
}
function load_spinner(callback) {
  const xhr = new XMLHttpRequest();

  // Configure it: GET-request to the URL /example/data
  xhr.open('GET', '/static/spinner.json', true);

  // Setup a function to handle the response
  xhr.onreadystatechange =  () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // Parse the JSON response
      const spinner_model = JSON.parse(xhr.responseText);
      // Log or use the response data
      callback(spinner_model);
    }
  };
  xhr.send();
}
window.addEventListener('load', () => {load_spinner(setup)});