const userLocale =
  navigator.languages && navigator.languages.length
    ? navigator.languages[0]
    : navigator.language;

const districtsBarChart = document.getElementById("districtsBarChart");
const list = document.getElementById("roadworkList");
const dataUrl = "https://localhost:7189/Roadworks";

const map = createMap(51.51661, 7.45829, 12, 19, "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");

var redIcon = new L.Icon({
	iconUrl: 'marker-icon-2x-red.png',
	shadowUrl: 'marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

let markerList = [];

let roadworkData;

fetchRoadworkData();

async function fetchRoadworkData() {
    let response = await fetch(dataUrl)
    let json = await response.json();

    roadworkData = json;
    
    roadworkData.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    addRoadworkMarker(roadworkData);
    createCharts();
}

function sortByKey(obj){
    var sortedArray = [];

    for(var i in obj) {
        sortedArray.push([obj[i], i]);
    }

    return sortedArray.sort();
}

function createMap(viewX, viewY, zoom, maxZoom, tileLayerUrl) {
    let m = L.map("map").setView([viewX, viewY], zoom);

    L.tileLayer(tileLayerUrl, {
        maxZoom: maxZoom,
        attribution: "© OpenStreetMap | Fynn Budde"
    }).addTo(m);

    return m;
}

function addRoadworkMarker() {
    // Loops through roadworkData, adds markers to the map and list items to the roadwork list

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
}

function scrollToRoadworkMarkerItem(e) {
    let id = "rm" + e.target.options.listIndex;
    document.getElementById(id).scrollIntoView({behavior:"smooth", block:"center"});

    updateRoadworkTable(id);
}

function scrollToRoadworkMakerOnMap(e) {
    // Searches for the marker with the same id as s.srcElement and centers the map on it

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

    var date = new Date(data["zeit_von"].split(" ", 2)[0]);
    date = date.toLocaleDateString(userLocale, { weekday:"long", year:"numeric", month:"long", day:"numeric"}) 

    setValueOfElement("tableValuedistrict", data["ortsteil"]);
    setValueOfElement("tableValueStreet", data["name"]);
    setValueOfElement("tableValueLocation", data["ortslage"]);
    setValueOfElement("tableValueContractor", data["name1"]);
    setValueOfElement("tableValueReason", data["sp_grund"]);
    setValueOfElement("tableValueSince", date);
    setValueOfElement("tableValueInfo", data["festlegung"].replace("/(\n|\t)/gm", ""));
}

function setValueOfElement(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}

function createCharts() {
    createChart_districtsRoadworkCount();
    createChart_sinceYear();
}

function createChart_districtsRoadworkCount() {
    // Creates bar chart for the number of roadworks in each district 

    let districtsRoadworkCount = new Map();

    roadworkData.forEach((element) => {
        let district = element.ortsteil;

        districtExists = districtsRoadworkCount.has(district);
        if (districtExists) {
            districtsRoadworkCount.set(district, districtsRoadworkCount.get(district)+1);
        }else {
            districtsRoadworkCount.set(district, 1)
        }
    })

    let dataAxisX = [];
    let dataAxisY = [];
    districtsRoadworkCount.forEach(function(key, val){
        dataAxisX.push(key);
        dataAxisY.push(val);
    });
    let data = [
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
    let layout = {
        title: "Number of roadworks in the districts",
        barmode: 'stack',
        yaxis: {'categoryorder':'total ascending', tickangle: -45}
    };

    Plotly.newPlot("districtsBarChart", data, layout, {responsive: true, displayModeBar: false});
}

function createChart_sinceYear() {
    let years = new Map();

    roadworkData.forEach((element) => {
        let year = new Date(element["zeit_von"].split(" ", 2)[0]).getFullYear();

        yearExists = years.has(year);
        if (yearExists) {
            years.set(year, years.get(year)+1);
        }else {
            years.set(year, 1)
        }
    })

    let valuesData = [];
    let labelsData = [];
    years.forEach(function(key, val){
        valuesData.push(key);
        labelsData.push(val);
    });

    let data = [{
        type: "pie",
        values: valuesData,
        labels: labelsData,
        textinfo: "none",
        insidetextorientation: "radial"
      }]
    
    let layout = {
        title: "Roadworks started since",
        legend: {x: 0, y: 0},
        autosize: true
      }
      
      Plotly.newPlot("yearsPieChart", data, layout, {responsive: true, displayModeBar: false});
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