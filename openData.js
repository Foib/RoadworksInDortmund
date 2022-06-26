const userLocale =
  navigator.languages && navigator.languages.length
    ? navigator.languages[0]
    : navigator.language;

const suburbsBarChart = document.getElementById("suburbsBarChart");
const list = document.getElementById("roadworkList");

let map = L.map('map').setView([51.51661, 7.45829], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap | Fynn Budde'
}).addTo(map);

var redIcon = new L.Icon({
	iconUrl: 'marker-icon-2x-red.png',
	shadowUrl: 'marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

let roadworkData;
const dataUrl = "https://localhost:7189/Roadworks";
ajax_get(dataUrl, function(data) {
    roadworkData = data;
    addRoadworkMarker(data);
    createCharts();
});

let markerList = [];

function addRoadworkMarker(roadworkData) {
    roadworkData.forEach((element, index) => {
        const coords = utmToLatLng(32, element["rechtswert"], element["hochwert"], true);
        
        let marker = L.marker([coords["lat"], coords["lng"]], {"listIndex": index, "icon": redIcon}).addTo(map);

        marker.bindPopup(element["name"]);
    
        marker.on("click", scrollToRoadworkMarkerItem);

        markerList.push({"marker": marker, "id": "rm" + index});

        let li = document.createElement("li");
        li.className = "rmItem";
        li.id = "rm" + index;
        li.innerText = element["name"];
        li.onclick = scrollToRoadworkMakerOnMap;
        list.appendChild(li);
    });

    sortRoadworkList();
}

function scrollToRoadworkMarkerItem(e) {
    let id = "rm" + e.target.options.listIndex;
    document.getElementById(id).scrollIntoView({behavior:"smooth", block:"center"});

    updateRoadworkTable(id);
}

function scrollToRoadworkMakerOnMap(e) {
    let markerID = e.srcElement.id;

    for (let i = 0; i < markerList.length; i++) {
        let iMarker = markerList[i];
        if (iMarker.id == markerID) {
            iMarker.marker.openPopup();
            centerLeafletMapOnMarker(iMarker.marker);
            break;
        }
    }

    updateRoadworkTable(markerID);
}

function updateRoadworkTable(id) {
    id = parseInt(id.replace("rm", ""));
    data = roadworkData[id];    
    
    console.log(userLocale)

    var d = new Date(data["zeit_von"].split(" ", 2)[0]);
    d = d.toLocaleDateString(userLocale, { weekday:"long", year:"numeric", month:"long", day:"numeric"}) 

    setValueOfElement("tableValueSuburb", data["ortsteil"]);
    setValueOfElement("tableValueStreet", data["name"]);
    setValueOfElement("tableValueLocation", data["ortslage"]);
    setValueOfElement("tableValueContractor", data["name1"]);
    setValueOfElement("tableValueReason", data["sp_grund"]);
    setValueOfElement("tableValueSince", d);
    setValueOfElement("tableValueInfo", data["festlegung"].replace("/(\n|\t)/gm", ""));
}

function setValueOfElement(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}

function createCharts() {
    createChart_suburbsRoadworkCount();
}

function createChart_suburbsRoadworkCount() {
    let suburbsRoadworkCount = new Map();
    suburbsRoadworkCount.set("Innenstadt-West", 0);
    suburbsRoadworkCount.set("Innenstadt-Nord", 0);
    suburbsRoadworkCount.set("Innenstadt-Ost", 0);
    suburbsRoadworkCount.set("Eving", 0);
    suburbsRoadworkCount.set("Scharnhorst", 0);
    suburbsRoadworkCount.set("Brackel", 0);
    suburbsRoadworkCount.set("Aplerbeck", 0);
    suburbsRoadworkCount.set("Hörde", 0);
    suburbsRoadworkCount.set("Hombruch", 0);
    suburbsRoadworkCount.set("Lütgendortmund", 0);
    suburbsRoadworkCount.set("Huckarde", 0);
    suburbsRoadworkCount.set("Mengede", 0);

    roadworkData.forEach((element) => {
        let suburb = element.ortsteil;
        suburbsRoadworkCount.set(suburb, suburbsRoadworkCount.get(suburb)+1);
    })

    let dataAxisX = [];
    let dataAxisY = [];
    suburbsRoadworkCount.forEach(function(key, val){
        dataAxisX.push(key);
        dataAxisY.push(val);
    });
    let suburbsBarChart_data = [
        {
            x: dataAxisX,
            y: dataAxisY,
            type: 'bar',
            orientation: "h",
            text: dataAxisX,
            textposition: 'auto',
            hoverinfo: 'none',
            marker: {
                color: "rgba(200,0,0,0.6)",
                width: 1
            }
        }
    ];
    var suburbsBarChart_layout = {
        title: "Number of roadworks in the suburbs",
        barmode: 'stack',
        yaxis: {'categoryorder':'total ascending', tickangle: -45}
    };

    Plotly.newPlot("suburbsBarChart", suburbsBarChart_data, suburbsBarChart_layout, {responsive: true, displayModeBar: false});
}

function centerLeafletMapOnMarker(marker) {
    map.setView(marker.getLatLng(), map.getZoom());
}

function utmToLatLng(zone, easting, northing, northernHemisphere) {
    if (!northernHemisphere) {
        northing = 10000000 - northing;
    }

    var a = 6378137;
    var e = 0.081819191;
    var e1sq = 0.006739497;
    var k0 = 0.9996;
    var arc = northing / k0;

    var mu = arc / (a * (1 - Math.pow(e, 2) / 4.0 - 3 * Math.pow(e, 4) / 64.0 - 5 * Math.pow(e, 6) / 256.0));
    var ei = (1 - Math.pow((1 - e * e), (1 / 2.0))) / (1 + Math.pow((1 - e * e), (1 / 2.0)));
    var ca = 3 * ei / 2 - 27 * Math.pow(ei, 3) / 32.0;
    var cb = 21 * Math.pow(ei, 2) / 16 - 55 * Math.pow(ei, 4) / 32;
    var cc = 151 * Math.pow(ei, 3) / 96;
    var cd = 1097 * Math.pow(ei, 4) / 512;

    var phi1 = mu + ca * Math.sin(2 * mu) + cb * Math.sin(4 * mu) + cc * Math.sin(6 * mu) + cd * Math.sin(8 * mu);

    var n0 = a / Math.pow((1 - Math.pow((e * Math.sin(phi1)), 2)), (1 / 2.0));
    var r0 = a * (1 - e * e) / Math.pow((1 - Math.pow((e * Math.sin(phi1)), 2)), (3 / 2.0));
    var fact1 = n0 * Math.tan(phi1) / r0;
    var _a1 = 500000 - easting;
    var dd0 = _a1 / (n0 * k0);
    var fact2 = dd0 * dd0 / 2;
    var t0 = Math.pow(Math.tan(phi1), 2);
    var Q0 = e1sq * Math.pow(Math.cos(phi1), 2);
    var fact3 = (5 + 3 * t0 + 10 * Q0 - 4 * Q0 * Q0 - 9 * e1sq) * Math.pow(dd0, 4) / 24;
    var fact4 = (61 + 90 * t0 + 298 * Q0 + 45 * t0 * t0 - 252 * e1sq - 3 * Q0 * Q0) * Math.pow(dd0, 6) / 720;
    var lof1 = _a1 / (n0 * k0);

    var lof2 = (1 + 2 * t0 + Q0) * Math.pow(dd0, 3) / 6.0;
    var lof3 = (5 - 2 * Q0 + 28 * t0 - 3 * Math.pow(Q0, 2) + 8 * e1sq + 24 * Math.pow(t0, 2)) * Math.pow(dd0, 5) / 120;
    var _a2 = (lof1 - lof2 + lof3) / Math.cos(phi1);
    var _a3 = _a2 * 180 / Math.PI;
  
    var latitude = 180 * (phi1 - fact1 * (fact2 + fact3 + fact4)) / Math.PI;
    if (!northernHemisphere) {
        latitude = -latitude;
    }
  
    var longitude = ((zone > 0) && (6 * zone - 183.0) || 3.0) - _a3;
  
    var obj = {
        "lat": latitude,
        "lng": longitude
    };
  
    return obj;
}

function ajax_get(url, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            let data = undefined;
            try {
                data = JSON.parse(xmlhttp.responseText);
            } catch(err) {
                console.log(err.message + " in " + xmlhttp.responseText);
                return;
            }
            callback(data);
        }
    };
 
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function sortRoadworkList() {
    var list, i, switching, b, shouldSwitch;
    list = document.getElementById("roadworkList");
    switching = true;
    while (switching) {
      switching = false;
      b = list.getElementsByTagName("LI");
      for (i = 0; i < (b.length - 1); i++) {
        shouldSwitch = false;
        if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        b[i].parentNode.insertBefore(b[i + 1], b[i]);
        switching = true;
      }
    }
  }