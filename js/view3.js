// Initialize charts
let radialChart;

// Load data
Promise.all([
    d3.csv('data/PatientRoute.csv'),
    d3.csv('data/province_population.csv')

]).then(files => {
    let patientRoute = files[0];

    // this gets all the cities to appear around the ring (need the routes now)
    var patientArray = [];
    patientRoute.forEach(p => {
        let city = p['city'];
        let found = false;

        for(var i = 0; i < patientArray.length; i++) {
            if (patientArray[i].name === city) {
                found = true;
                break;
            }
        }

        if (!found) {
            const patientObj = {
                name: city,
                size: 1,
                routes: [],
                pop: 0
            };
            patientArray.push(patientObj);
        }

        let cities = p['route'].split('/');
        cities.forEach(city => {
            let found = false;

            for(var i = 0; i < patientArray.length; i++) {
                if (patientArray[i].name === city) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                const patientObj = {
                    name: city,
                    size: 1,
                    routes: [],
                    pop: 0
                };
                patientArray.push(patientObj);
            }
        });
    });

    // routes
    patientRoute.forEach(p => {
        let city = p['city'];
        let routes = p['route'].split('/');

        for(var i = 0; i < patientArray.length; i++) {
            if (patientArray[i].name === city) {
                routes.forEach(route => {
                    if (!patientArray[i].routes.includes(route)) {
                        !patientArray[i].routes.push(route);
                    }
                });
            }
        }
    });

    // increment pop
    patientRoute.forEach(p => {
        let routes = p['route'].split('/');
        let city = p['city'];
        for (var i = 0; i < patientArray.length; i++) {
            if (patientArray[i].name === city ) {
                patientArray[i].pop++;
            }
        }

        routes.forEach(route => {
            for (var i = 0; i < patientArray.length; i++) {
                if (patientArray[i].name === route ) {
                    patientArray[i].pop++;
                }
            }
        });
    });

    console.log(patientArray);

    radialChart = new RadialChart({ parentElement: '#radialchart' });
    radialChart.patientRoute = patientArray;
    radialChart.update();
});







