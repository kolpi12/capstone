function map_init(boxId, mapJson, mapObj){
    var WIDTH = 750,
    HEIGHT = 610;
    
    var svg = d3.select(boxId).append("svg")
    .attr("width", WIDTH)
    .attr('height', HEIGHT);

    var map = svg.append("g").attr("id", "map");
    d3.json(mapJson).then(function(d){
        var mapData = topojson.feature(d, d.objects[mapObj]);
        var features = mapData.features;
        
        var center = d3.geoCentroid(mapData);
        center[0] -= 0.015;
        center[1] += 0.015;
        var scale = 100000;
    
        var projection = d3.geoMercator().translate([WIDTH/2, HEIGHT/2])
            .scale(scale).center(center);
        var path = d3.geoPath().projection(projection);

        map.selectAll("path")
            .data(features)
            .enter().append("path")
            .attr("d", path)
            .on("mouseover", function(d){
                setTooltip(d.properties.SIG_KOR_LN, d.properties.ADM_DR_NM, d.properties.EMD_HJ_CD);
            });

            // .on("mouseover", function(){ // 마우스 호버 시 z-index 높이기 위함
            //     d3.select(this).raise();
            // });
            // mouseout
    });

    var guName = document.querySelector("#gu_nm > h3");
    var dongName = document.querySelector("#dong_nm > h3");
    function setTooltip(gu, dong, hjCd){
        guName.innerText = gu;
        dongName.innerText = dong;
    }
}
