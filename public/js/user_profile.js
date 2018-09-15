$(document).ready(function () {
    $("#nav_menu ul li#default").css("border-right", "4px solid #009688");
    $("#nav_menu ul li").click(function() {
        $("#nav_menu ul li").css("border-right", "0px solid white");
        $(this).css("border-right", "4px solid #009688");
    });
    $("#nav_menu ul li").focus(function() {
        $("#nav_menu ul li").css("border-right", "4px solid #009688");
    });
});
