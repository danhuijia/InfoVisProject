// Initialize charts
let choroplethMap;
let barchart;

// Load data
Promise.all([
    d3.json('data/south_korea_provinces.topo.json'), // sk municipalities
    d3.json('data/real_provinces.topo.json'),// sk province

    d3.csv('data/municipality_population.csv'), // municipality population data
    d3.csv('data/PatientInfo.csv'), // Patient individuals
    d3.csv('data/province_population.csv'), // province population data

    d3.csv('data/TimeProvince.csv') // status counts by province
]).then(files => {
    let municipality_population = files[2];
    municipality_population.forEach(d => {
        d['pop_2019'] = +d['pop_2019'];
    });

    let province_population = files[4];
    province_population.forEach(d => {
        d['pop_2019'] = +d['pop_2019'];
    });

    let patient_info = files[3];

    // Data for the View 1 Pie Chart for MUNICIPALITIES 
    let patientInfoByMunicipalityAndStatus = {};
    patient_info.forEach(d => {
        const currentMunicipality = d['city'];
        const currentState = d['state'];
        if (currentMunicipality in patientInfoByMunicipalityAndStatus) {
            patientInfoByMunicipalityAndStatus[currentMunicipality]['Total'] += 1;

            if (currentState in patientInfoByMunicipalityAndStatus[currentMunicipality]) {
                patientInfoByMunicipalityAndStatus[currentMunicipality][currentState] += 1;
            } else {
                patientInfoByMunicipalityAndStatus[currentMunicipality][currentState] = 1;
            }
        } else {
            patientInfoByMunicipalityAndStatus[currentMunicipality] = {};
            patientInfoByMunicipalityAndStatus[currentMunicipality]['Total'] = 1;
            patientInfoByMunicipalityAndStatus[currentMunicipality][currentState] = 1;
        }
    });

    // Data for the View 1 Pie Chart for PROVINCES 
    let patientInfoByProvinceAndStatus = {};
    patient_info.forEach(d => {
        const currentProvince = d['province'];
        const currentState = d['state'];
        if (currentProvince in patientInfoByProvinceAndStatus) {
            patientInfoByProvinceAndStatus[currentProvince]['Total'] += 1;

            if (currentState in patientInfoByProvinceAndStatus[currentProvince]) {
                patientInfoByProvinceAndStatus[currentProvince][currentState] += 1;
            } else {
                patientInfoByProvinceAndStatus[currentProvince][currentState] = 1;
            }
        } else {
            patientInfoByProvinceAndStatus[currentProvince] = {};
            patientInfoByProvinceAndStatus[currentProvince]['Total'] = 1;
            patientInfoByProvinceAndStatus[currentProvince][currentState] = 1;
        }
    });


    // initialize choroplethMap fields
    choroplethMap = new ChoroplethMap({ parentElement: '#map' });
    choroplethMap.korea_city_geo = files[0];
    choroplethMap.province_geo = files[1];
    choroplethMap.province_population = province_population;
    choroplethMap.municipality_population = municipality_population;
    choroplethMap.patientInfoByProvinceAndStatus = patientInfoByProvinceAndStatus;
    choroplethMap.patientInfoByMunicipalityAndStatus = patientInfoByMunicipalityAndStatus;
    choroplethMap.display = "Province";
    choroplethMap.update();

    // initialize barchart fields
    barchart = new Barchart({ parentElement: '#barchart'});
    barchart.data = patientInfoByProvinceAndStatus;
    barchart.factor = "Total";
    barchart.date ="2020-03-20";
    barchart.patient_info = patient_info;
    barchart.update();
});




$("#select-province").on('click', function()
{
    if (document.getElementById("select-province").value === "Municipality") {
        choroplethMap.display = "Municipality";
        choroplethMap.update();
        // change button value to Province
        document.getElementById("select-province").value = "Province";
    } else {
        choroplethMap.display = "Province";
        choroplethMap.update();
        // change button value to City
        document.getElementById("select-province").value = "Municipality";

    }
});

// Event listener for View II

$("#select-date").on('click',function(){
    date = document.getElementById("datepicker").value;
    barchart.date = date;
    barchart.update();
});

$("#filter-select").on('change', function()
{
    factor = $(this).val();
    barchart.factor = factor;
    barchart.update();
});


