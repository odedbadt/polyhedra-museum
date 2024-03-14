import { Renderer } from './renderer.js'
function load_model(model_url, callback) {
  const xhr = new XMLHttpRequest();

  // Configure it: GET-request to the URL /example/data
  xhr.open('GET', model_url + '#' + Date.now(), true);

  // Setup a function to handle the response
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // Parse the JSON response
      var model = JSON.parse(xhr.responseText);
      // Log or use the response data
      console.log(model);
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
  load_model(locate_url_for_name(model_name),
    (model) => {
      if (window.renderer) {
        window.renderer.set_model(model);
      } else {
        window.renderer = new Renderer(model)
        window.renderer.init_and_draw()
      }
    })
};

function setup() {
  const select = document.getElementById('model-select');
  const first_model = window.first_model || document.getElementsByClassName('select-option')[0].value;
  select.addEventListener('change' ,(event) => {
        document.getElementById('shape-name').innerHTML = select.value.replace('.json','');

        load_and_set_model(select.value);

  });
  load_model(locate_url_for_name(first_model),
    (model) => {
    window.renderer = new Renderer(model);
    window.renderer.init_and_draw();
    });
  
}
window.addEventListener('load', setup);