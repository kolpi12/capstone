function map_init(boxId, mapJson, mapObj){
    var WIDTH = 1024,
    HEIGHT = 768
    
    var svg = d3.select(boxId).append("svg")
    .attr("width", WIDTH)
    .attr('height', HEIGHT);
    
    var map = svg.append("g").attr("id", "map");
    
    d3.json(mapJson).then(function(d){
        var mapData = topojson.feature(d, d.objects[mapObj]);
        var features = mapData.features;
        
        var bounds = d3.geoBounds(mapData);
        var center = d3.geoCentroid(mapData);
        
        var distance = d3.geoDistance(bounds[0], bounds[1]);
        var scale = HEIGHT / distance / Math.sqrt(2) * 1.5;
    
        var projection = d3.geoMercator().translate([WIDTH/2, HEIGHT/2])
            .scale(scale).center(center);
        var path = d3.geoPath().projection(projection);

        map.selectAll("path")
            .data(features)
            .enter().append("path")
            .attr("d", path)
            // .on("mouseover", function(){ // 마우스 호버 시 z-index 높이기 위함
            //     d3.select(this).raise();
            // });
    });
}
