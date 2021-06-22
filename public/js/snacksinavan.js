function OnLoad(){
	IntroTransition();
}

/* Splash screen interstitial sequencing */
function IntroTransition(){
	bubble = document.querySelector("#introbg-bubble")
	if(bubble==null) return;
	bubble.classList.add("introbg-grow");
	var layers = document.querySelectorAll(".introbg-layer")
	for (i=0; i<layers.length; ++i){ 
		layers[i].classList.add("introbg-transition");
	}
}

/* Pre-validate login elements */
function LoginVal(form){
	form = document.getElementById(form);
	email = FormValidation(form.email);
	pass =  FormValidation(form.password);
	if (email && pass) {
		form.submit();
	} else {
		document.querySelector("#error").innerHTML = "Please enter "+ (email?"":"an email") + (!email&&!pass?" and":"") + (pass?"":" password")+".";
	}
	
	return email && pass;
}
function FormValidation(field){
	r = false;
	//alert(field.value);
	switch( field.name ) {
		case "email": 
			r = isValidEmail(field.value);
		break;
		case "password": 
			r = field.value.length>0;
		break;		
		default: 
			alert("BAD_VALIDATE");
	}
	if (!r) field.classList.add("formFieldInvalid");
	else field.classList.remove("formFieldInvalid");
	
	return r;
}
/* Regex for vald email address strings */
function isValidEmail(s){
	return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(s); 
}

/* Header: hamburger menu visibility toggle event */
var isBurgVisible = false;
function ToggleBurger(){
	var burgLayer = document.querySelector("#burger-layer");
	var burgMenu = document.querySelector("#slide-menu");
	var burgIcon = document.querySelector("#hamburger");
	var burgIconX = document.querySelector("#hamburgerX");
	
	// If it's visible, let's hide it
	if( isBurgVisible ){ 
		isBurgVisible = false;
		// Remove toggle event from dark layer when we can't see it
		burgLayer.onclick = ""; 
		burgLayer.style.pointerEvents = "none";
		
		// Make the menu slide+fade out by attaching and removing classes to trigger CSS animations 
		burgLayer.classList.add("fade-out");
		burgLayer.classList.remove("fade-in");
		burgMenu.classList.add("slide-out");
		burgMenu.classList.remove("slide-in");
		burgIcon.src = "../../img/burger.png"; // Burger icon restoration
	}
	// If it's hidden, now appear
	else{ 
		isBurgVisible = true;
		// Reattach toggle event so you can close the menu by clicking anywhere
		burgLayer.onclick = ToggleBurger; 
		burgLayer.style.pointerEvents = "auto";
		
		// Slide+fade in with animating classes 
		burgLayer.style.display = "block";
		burgLayer.classList.add("fade-in");
		burgLayer.classList.remove("fade-out");
		burgMenu.classList.add("slide-in");
		burgMenu.classList.remove("slide-out");
		burgIcon.src = "../../img/burger-x.png"; // Burger icon becomes an X
	}
}

function add_to_cart(itemid, van, price)
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			//do anything on the page here since this means it worked
			console.log("got here")
			var quant = document.getElementById(itemid);
			quant.innerHTML++;
			var totalPlus = document.getElementById("totalCost");
			totalPlus.innerHTML = (Number(totalPlus.innerHTML) + Number(price)).toFixed(2);
		}
	};
	xhttp.open("POST", "/customer/startOrder/"+van+"/"+itemid+ "/add", true);
	xhttp.send();
}

function remove_from_cart(itemid, van, price)
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			//do anything on the page here since this means it worked
			var quant = document.getElementById(itemid);
			if (quant.innerHTML > 0)
			{
				quant.innerHTML--;
				var total = document.getElementById("totalCost");
				total.innerHTML = (Number(total.innerHTML) - Number(price)).toFixed(2);
			}
			//window.location.reload(true);
		}
	};
	xhttp.open("POST", "/customer/startOrder/"+van+"/"+itemid+ "/remove", true);
	xhttp.send();
}

function cancel()
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function()
	{
		if(this.readyState == 4 && this.status == 200)
		{
			//do anything on the page here since this means it worked
			window.location.replace("/customer/startOrder")
		}
	};
	console.log('confirmed')
	xhttp.open("POST", "/customer/cancelOrder", true);
	xhttp.send();
}


