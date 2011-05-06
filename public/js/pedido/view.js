function btnLogin_handleClick(){
	$('#login img').show();
	app.trigger('requestLogin');
}

function onItemShowInfoClick(event){
	target = event.currentTarget;
	$(target).next('.details').show();
	$(target).hide();
}
//Used in routs to hide all step divs
function hideAllDivs(){
$('#loading').hide();
$('#login').hide();
$('#listPedido').hide();
$('#selectCliente').hide();
$('#doPedido').hide();
$('#doOpp').hide();
$('#txt_searchCliente,#txt_searchProducto').val='';
}
 

//Exectues onChange of Input type text in Search Productos
function onItemChange(event){
target = event.currentTarget;
id=$(target).attr('data-id');
type = $(target).attr('data-type');
reset = $(target).attr('data-resetValue');
if(target.type=='checkbox'){
value = target.checked;
}
else{
value = $(target).val();
}
if(reset!=null){
	$(target).val('');
}
app.trigger('changeItem',{id: id,value: value,type: type});
}

//Executes onchange of txt_searchcliente
function doSearchClientes(){
var currentVal = $('#txt_searchCliente').val();
var results=[];
var count = clientes.length -1;
while(count > -1){
var cliente = clientes[count];
var res = cliente.Name.toLowerCase().search(currentVal.toLowerCase());
if(res>-1){
results.push(cliente);
}
count--;
}
app.trigger('doShowClienteSearchResult',{results: results});
}

//executes onChange of txtSearchProducto
function doSearchProductos(){
var currentVal = $('#txt_searchProducto').val();
var results=[];
var count = productos.length -1;
while(count > -1){
var producto = productos[count];
var res = producto.Name.toLowerCase().search(currentVal.toLowerCase());
if(res>-1){
results.push(producto);
}
count--;
}
app.trigger('doShowProductoSearchResult',{results: results});
}
