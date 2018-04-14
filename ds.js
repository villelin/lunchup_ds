const pb2 = new PB2('https://pb2-2018.jelastic.metropolia.fi/', 'lunchup');


let restaurantChoice = 16435;
let gluteeniton = false;
let maidoton = false;
let laktoositon = false;
let vahalaktoosinen = false;

if (localStorage.getItem('lunchup_menu_G') !== null) {
  let glute = JSON.parse(localStorage.getItem('lunchup_menu_G'));
  gluteeniton = glute.value;
  document.querySelector('#gluteeniton').checked = gluteeniton;
}
if (localStorage.getItem('lunchup_menu_M') !== null) {
  let maido = JSON.parse(localStorage.getItem('lunchup_menu_M'));
  maidoton = maido.value;
  document.querySelector('#maidoton').checked = maidoton;
}
if (localStorage.getItem('lunchup_menu_L') !== null) {
  let lakto = JSON.parse(localStorage.getItem('lunchup_menu_L'));
  laktoositon = lakto.value;
  document.querySelector('#laktoositon').checked = laktoositon;
}
if (localStorage.getItem('lunchup_menu_VL') !== null) {
  let vahalakt = JSON.parse(localStorage.getItem('lunchup_menu_VL'));
  vahalaktoosinen = vahalakt.value;
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
      let lakto = {value: laktoositon};
      localStorage.setItem('lunchup_menu_L', JSON.stringify(lakto));
      sendLunchMenuUpdate();
    });

document.querySelector('#gluteeniton').addEventListener('change',
    (event) => {
      gluteeniton = event.target.checked;
      let glute = {value: gluteeniton};
      localStorage.setItem('lunchup_menu_G', JSON.stringify(glute));
      sendLunchMenuUpdate();
    });

document.querySelector('#maidoton').addEventListener('change',
    (event) => {
      maidoton = event.target.checked;
      let maido = {value: maidoton};
      localStorage.setItem('lunchup_menu_M', JSON.stringify(maido));
      sendLunchMenuUpdate();
    });

document.querySelector('#vahalaktoosinen').addEventListener('change',
    (event) => {
      vahalaktoosinen = event.target.checked;
      let vahalakt = {value: vahalaktoosinen};
      localStorage.setItem('lunchup_menu_VL', JSON.stringify(vahalakt));
      sendLunchMenuUpdate();
    });

pb2.setReceiver((data) => {
  console.log('socket.on message received: ' + data);
  console.log(data.json.id);

  // aseta uusi ravintola, jos viestissä on ravintola-ID
  if (data.json.id !== undefined) {
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
  }

  // aseta uusi kieli, jos viestissä on kieli
  if (data.json.language !== undefined) {
    chooseLanguage(data.json.language);
  }
});

const formatNumber = (number) => {
  return (number < 10 ? '0' : '') + number;
};


const getCurrentTime = () => {
  const d = new Date();
  const hours = formatNumber(d.getHours());
  const minutes = formatNumber(d.getMinutes());
  const seconds = formatNumber(d.getSeconds());

  return {hours: hours, minutes: minutes, seconds: seconds};
};


const processFoodItems = (items, filters) => {
  let results = [];

  let counter = 1;

  items.forEach((item) => {
    let foodTitleFI = item.title_fi;
    let foodTitleEN = item.title_en;

    let foodPrice = '';
    let foodProperties = item.properties;

    // formatoi hinta
    const priceRegex = /[0-9],[0-9][0-9]/;
    const prices = priceRegex.exec(item.price);
    console.log(prices);
    console.log(prices.length);
    prices.forEach((price, index) => {
      foodPrice += `${price}&euro;`;
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

    // filtteröi ruokavaliot jos niitä on
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
      let entry = {
        counter: counter,
        titleFi: foodTitleFI,
        titleEn: foodTitleEN,
        properties: props,
        price: foodPrice,
      };

      results.push(entry);
      counter++;
    }
  });

  return results;
};


const ravintolaData = {
  '16435': {
    lounasStart: 630,
    lounasEnd: 870,
  },
  '16364': {
    lounasStart: 630,
    lounasEnd: 780,
  },
  '16365': {
    lounasStart: 630,
    lounasEnd: 870,
  },
  '16363': {
    lounasStart: 630,
    lounasEnd: 840,
  },
  '16448': {
    lounasStart: 630,
    lounasEnd: 840,
  },
};


const getLunchMenu = (id, filters) => {
  const apiUrl = 'https://www.sodexo.fi/ruokalistat/output/daily_json';

  const d = new Date();

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

            let ravintola = ravintolaData[`${id}`];

            let dateOptions = {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            };

            let dateStringFI = d.toLocaleDateString('fi-FI', dateOptions);
            let banneriFI = '';

            banneriFI += `${dateStringFI}`;

            for (let i=0; i < 20; i++) {
              banneriFI += '&nbsp';
            }

            if (ravintola !== undefined) {
              const currentTime = getCurrentTime();
              const minutes = (parseInt(currentTime.hours) * 60) +
                  parseInt(currentTime.minutes);

              if (minutes >= ravintola.lounasStart &&
                  minutes <= ravintola.lounasEnd) {
                banneriFI += `LOUNASTA TARJOLLA`;
              } else {
                banneriFI += `LOUNASTA EI  TARJOLLA`;
              }

              let startHour = parseInt(ravintola.lounasStart / 60);
              let startMin = parseInt(ravintola.lounasStart % 60);
              let endHour = parseInt(ravintola.lounasEnd / 60);
              let endMin = parseInt(ravintola.lounasEnd % 60);

              let times = `${startHour}:${startMin}-${endHour}:${endMin}`;

              banneriFI += ` (LOUNASAJAT ${times})`;
            }

            document.querySelector('#mainosbanneriFI').innerHTML = banneriFI;

            html +=`<div class="grid-container">`;

            const results = processFoodItems(data.courses, filters);

            results.forEach((result) => {
              html += `<div class="grid-item">${result.counter}.</div>`;
              html += `<div class="grid-item">
                       <span lang="fi">${result.titleFi}</span>
                       <span lang="en">${result.titleEn}</span>
                       </div>`;
              html += `<div class="grid-item">${result.price}</div>`;

              html += `<div class="grid-item">`;
              html += `<div class="properties">`;
              result.properties.forEach((prop) => {
                html += `<div>${prop.toUpperCase()}</div>`;
              });
              html += `</div>`;
              html += `</div>`;
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

// oletusravintola: Leppävaara
getLunchMenu(16435, ['g', 'm', 'vl', 'l']);

window.setInterval(() => {
  let time = getCurrentTime();

  let kello = `${time.hours}:${time.minutes}:${time.seconds}`;
  document.querySelector('#kello').innerHTML = kello;
}, 1000);


const chooseLanguage = (language) => {
  document.querySelectorAll('*:not(html)').forEach((node) => {
    let lang = node.getAttribute('lang');

    // piilota jos elementillä on kieli-attribuutti, ja se ei täsmää
    if (lang !== null && lang !== language) {
      node.style.display = 'none';
    }
  });

  document.querySelectorAll('*:not(hmtl)').forEach((node) => {
    let lang = node.getAttribute('lang');

    // näytä jos elementillä on kieli-attribuutti, ja se täsmää
    if (lang !== null && lang === language) {
      node.style.display = 'unset';
    }
  });
}

// oletuskielenä Suomi
chooseLanguage('fi');

document.querySelector('#languageChoose').
    addEventListener('change', (event) => {
      console.log(event.target.value);

      const msg = {};
      msg.language = event.target.value;

      pb2.sendJson(msg);
    });
