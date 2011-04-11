require 'rubygems'
require 'sinatra'
require 'haml'
require 'ninesixty'
require 'json'
require 'excelsior'
require 'rforce'

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

get '/importCSV' do
  content_type 'text/html', :charset => 'utf-8'
    ENV['SHOWSOAP'] = 'true'

      binding = RForce::Binding.new \
         'https://www.salesforce.com/services/Soap/u/20.0'

       binding.login \
         'salesforce@rodcocr.com', 'company1'
   
   rows = []
   
   
    Excelsior::Reader.rows(File.open('/Users/roberto/Proyectos/Rodco/svn/ruby/web/public/productos.csv', 'rb')) do |row|
     rows << row
   end


    productos=[]
    rows.each do |producto|
      producto = {:type,'Producto__c',:CodigoExterno__c,    producto[0], :NombreWeb__c,      producto[1] , 'descripcion__c' , producto[2] }
    
      productos.push(producto)
    end
      
      
        while productos.length > 0
          upsert = [];
          upsert.push(:externalIDFieldName,'CodigoExterno__c');
          while upsert.length < 390  && productos.length > 0
            upsert.push(:sObjects)
            upsert.push(productos.pop)
          end
          binding.upsert upsert
        end
        
        
      
     
           
   
 

 
end

def render_file(filename)
  contents = File.read('views/'+filename+'.haml')
  Haml::Engine.new(contents).render
end