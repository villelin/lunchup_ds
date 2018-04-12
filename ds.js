const pb2 = new PB2('https://pb2-2018.jelastic.metropolia.fi/', 'lunchup');

let restaurantChoice = 16435;
let gluteeniton = false;
let maidoton = false;
let laktoositon = false;
let vahalaktoosinen = false;

if (localStorage.getItem('lunchup_menu_G') !== null) {
  gluteeniton = localStorage.getItem('lunchup_menu_G');
  document.querySelector('#gluteeniton').checked = gluteeniton;
}
if (localStorage.getItem('lunchup_menu_M') !== null) {
  maidoton = localStorage.getItem('lunchup_menu_M');
  document.querySelector('#maidoton').checked = maidoton;
}
if (localStorage.getItem('lunchup_menu_L') !== null) {
  laktoositon = localStorage.getItem('lunchup_menu_L');
  document.querySelector('#laktoositon').checked = laktoositon;
}
if (localStorage.getItem('lunchup_menu_VL') !== null) {
  vahalaktoosinen = localStorage.getItem('lunchup_menu_VL');
  document.querySelector('#vahalaktoosinen').checked = vahalaktoosinen;
}

const sendLunchMenuUpdate = () => {
  const msg = {};
  msg.id = restaurantChoice;
  msg.gluteeniton = gluteeniton;
  msg.maidoton = maidoton;
  msg.laktoositon = laktoositon;
  msg.vahalaktoosinen = vahalaktoosinen;

  pb2.sendJson(msg);
};

document.querySelector('#restaurantChoose').
    addEventListener('change', (event) => {
      console.log(event.target.value);

      restaurantChoice = event.target.value;
      sendLunchMenuUpdate();
    });

document.querySelector('#laktoositon').addEventListener('change',
    (event) => {
      laktoositon = event.target.checked;
      localStorage.setItem('lunchup_menu_L', laktoositon);
      sendLunchMenuUpdate();
    });

document.querySelector('#gluteeniton').addEventListener('change',
    (event) => {
      gluteeniton = event.target.checked;
      localStorage.setItem('lunchup_menu_G', gluteeniton);
      sendLunchMenuUpdate();
    });

document.querySelector('#maidoton').addEventListener('change',
    (event) => {
      maidoton = event.target.checked;
      localStorage.setItem('lunchup_menu_M', maidoton);
      sendLunchMenuUpdate();
    });

document.querySelector('#vahalaktoosinen').addEventListener('change',
    (event) => {
      vahalaktoosinen = event.target.checked;
      localStorage.setItem('lunchup_menu_VL', vahalaktoosinen);
      sendLunchMenuUpdate();
    });

pb2.setReceiver((data) => {
  console.log('socket.on message received: ' + data);
  console.log(data.json.id);

  let filters = [];
  if (data.json.gluteeniton) {
    filters.push('g');
  }
  if (data.json.laktoositon) {
    filters.push('l');
  }
  if (data.json.maidoton) {
    filters.push('m');
  }
  if (data.json.vahalaktoosinen) {
    filters.push('vl');
  }

  getLunchMenu(data.json.id, filters);
});

const formatNumber = (number) => {
  return (number < 10 ? '0' : '') + number;
};

const days = [
  'Sunnuntai', 'Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai',
  'Perjantai', 'Lauantai'];

const getLunchMenu = (id, filters) => {
  const apiUrl = 'https://www.sodexo.fi/ruokalistat/output/daily_json';

  const d = new Date();
  const weekday = d.getDay();

  const year = d.getFullYear();
  const month = formatNumber(d.getMonth() + 1);
  const day = formatNumber(d.getDate());
  const language = 'en';

  const settings = {method: 'GET', mode: 'cors'};

  fetch(`${apiUrl}/${id}/${year}/${month}/${day}/${language}`, settings).
      then((response) => {
        if (response.status === 200) {
          response.json().then((data) => {
            console.log(data.courses);

            let html = '';

            html += `<h1>${days[weekday]} ${day}.${month}.${year}</h1>`;
            html += `<h1 id="kello"></h1>`;

            html += `<div class="grid-container">`;

            let counter = 1;

            const courses = data.courses;
            courses.forEach((course) => {
              const foodTitle = course.title_fi;
              let foodPrice = '';
              let foodProperties = course.properties;




              const priceRegex = /[0-9],[0-9][0-9]/;
              const prices = priceRegex.exec(course.price);
              console.log(prices);
              console.log(prices.length);
              prices.forEach((price, index) => {
                foodPrice += `${price} &euro;`;
                console.log(price);
                if (index < prices.length-1) {
                  foodPrice += ' / ';
                }
              });


              let props = [];

              // parsi ruokavaliot jos niitä on
              if (foodProperties !== undefined) {
                foodProperties = foodProperties.toLowerCase();
                props = foodProperties.split(',');
                console.log(props);
              }

              let show;
              if (filters.length === 0) {
                show = true;
              } else {
                show = false;

                filters.forEach((filter) => {
                  switch (filter) {
                    case 'g': {
                      props.forEach((prop) => {
                        if (prop == 'g') {
                          show = true;
                        }
                      });
                      break;
                    }
                    case 'm': {
                      props.forEach((prop) => {
                        if (prop == 'm') {
                          show = true;
                        }
                      });
                      break;
                    }
                    case 'l': {
                      props.forEach((prop) => {
                        if (prop == 'l') {
                          show = true;
                        }
                      });
                      break;
                    }
                    case 'vl': {
                      props.forEach((prop) => {
                        if (prop == 'vl') {
                          show = true;
                        }
                      });
                      break;
                    }
                  }
                });
              }

              if (show) {
                html += `<div class="grid-item">${counter}</div>`
                html += `<div class="grid-item">${foodTitle}</div>`;
                html += `<div class="grid-item">${foodPrice}</div>`;

                html += `<div class="grid-item">`;
                html += `<div class="properties">`;
                props.forEach((prop) => {
                  html += `<div>${prop.toUpperCase()}</div>`;
                });
                html += `</div>`;
                html += `</div>`;

                counter++;
              }
            });

            html += `</div>`;

            document.querySelector('#ruokalista').innerHTML = html;
          });
        }
      }).
      catch((error) => {
        // virhe
        console.log(error);
      });
};

getLunchMenu(16435, ['g', 'm', 'vl', 'l']);

window.setInterval(() => {
  const d = new Date();
  const hours = formatNumber(d.getHours());
  const minutes = formatNumber(d.getMinutes());
  const seconds = formatNumber(d.getSeconds());

  let kello = `${hours}:${minutes}:${seconds}`;
  document.querySelector('#kello').innerHTML = kello;
}, 1000);
