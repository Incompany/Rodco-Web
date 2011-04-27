require 'rubygems'
require 'sinatra'
require 'haml'
require 'ninesixty'
require 'json'
require 'rforce'
require 'net/http'


get '/' do
 haml :index,{:layout => :homeLayout}
end

get '/pedidos' do
     
haml :pedidos
end

get '/corporativo' do
 haml :corporativo
end

get '/enLinea' do
 haml :enLinea
end

get '/catalogo' do
 haml :catalogo
end

get '/contacto' do
 haml :contacto
end

get '/styles' do
 haml :styles
end

get '/saveOpportunities' do
  opportunity = [
                      :type,'Producto__c',
                      :CodigoExterno__c,   '1016013002', 
                      :NombreWeb__c,      'producto[1]' , 
                      :Descripcion__c , 'producto[2]' ,
                      :Departamento__c, 'producto[9]',
                      :Categoria__c,'jkkkjjk',
                      :Marca__c,'jkkn'
                 ]
end

get '/getdata' do
  ENV['SHOWSOAP'] = 'true'
  
  begin
     Net::HTTP.get 'www.google.com', '/'
     
     #remove # to work remotely
     #return [404, {}, []]
     
  rescue
    return [404, {}, []]
  end
  
  email = params['username']
  password = params['password']
  token = params['token']
  secure = password + token
  
   binding = RForce::Binding.new \
      'https://test.salesforce.com/services/Soap/u/21.0'
      
    binding.login \
      email, secure

      records = [];

    answer = binding.query  \
      :queryString =>
        'select name,id,PrecioMinimo__c , Impuesto__c , InventarioActual__c, DescuentoMinimo__c , DescuentoMaximo__c from producto__c limit 5'

    records += answer.queryResponse.result.records
         
    answer = binding.query  \
    :queryString =>
      'select name,Id from cliente__c limit 5'
            
    records += answer.queryResponse.result.records
    
    return records.to_json
  end

def render_file(filename)
  contents = File.read('views/'+filename+'.haml')
  Haml::Engine.new(contents).render
end