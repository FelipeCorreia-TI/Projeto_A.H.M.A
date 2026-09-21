#include <Wire.h>

#include <LiquidCrystal_I2C.h>

#define col 16
#define lin 2
#define ende 0x27

LiquidCrystal_I2C lcd(ende,col,lin); //Chamamos a função do LiquidCrystal (LCD/VISOR) damos um nome para a instância de lcd com os valores de 
//end - Endereço do visor
//col - quantidade de colunas do visor
//lin - quantidade de linhas do visor
// resultando em 16x2 (x,y) (coluna,altura)

//0x27 - Serial do Display

char mensagemUmidade[20]; //Variável global tipo Character com espaço maximo de 20 caracteres
char textoUmidade[20];

void setup()
{
  
  pinMode(A0,INPUT); //Define a fução para o pino analog in A0 como entrada de dados
  
  Serial.begin(9600); //Ativa a comunicação serial placa computador em 9600 BITS

  lcd.init(); //Inicia a instância
  
  lcd.backlight(); // Liga a luz do display
  
  lcd.clear(); // Limpa tela do display

}

void loop()
{

  int moisterValue = 0; //Define o valor padrão do sensor (moister)

  

  moisterValue = 1023 - analogRead(A0); //Lê os valores analógicos do moister e atualiza a variável (anteriormente 0)
  
  
  lcd.clear(); //Atraves da instância criada, ele limpa tudo do display
  
  lcd.setCursor(1,0); //Define a coluna e linha que o 'cursor/ponteiro' deve ir
  
  lcd.print("Lendo Sensor..."); //escreve no sensor a mensagem/dado no ponteiro definido a cima
  
  delay(2000); // Delay de 2s
  
  
  float calculaUmidade = moisterValue * 100.0 / 1023.0; //Converte a umidade em porcentagem (%)
  
  dtostrf(calculaUmidade,4,1,textoUmidade); //Converte  decimal em string (pega o calculaUmidade, define como limite 4 casas e 2 após a virgula e joga na variável textoUmidade)
  
  sprintf(mensagemUmidade, "Umidade:%s%%",textoUmidade); //Define uma string formatada com (Var, Mensagem, valor que irá receber);
  
  
  //Área de DEBUG - ABRA O SERIAL MONITOR -
  Serial.print("Valor do sensor sem conversao: ");
  Serial.println(moisterValue);
  Serial.print("Valor em porcentagem apos conversao: ");
  Serial.print(calculaUmidade);
  Serial.println("%");  
  if(calculaUmidade <= 16){ //Se após o calculo da umidade (em porcentagem) for menor que 16%...
  
  

    
	  lcd.clear(); // Limpa o display
	
    lcd.setCursor(0,0); //Define o cursor na coluna 1 e linha 0
	
    lcd.print("Muito Seco"); //Exibe Alerta! no display
	
    lcd.setCursor(0,1); //Define o cursor na coluna 1 e linha 1 (desce uma linha)
	
    lcd.print(mensagemUmidade); //Exibe a mensagem de Umidade
    	
    delay(5000); //Pause de 5s para o a próxima repetição


    
  } else if (calculaUmidade >= 17 && calculaUmidade <= 33){
  
	//sensor: Vermelho
  

    
	//Sem explicação daqui em diante, pois tudo se repete.
	
    lcd.clear();
	
    lcd.setCursor(0,0);
	
    lcd.print("Seco");
	
    lcd.setCursor(0,1);
	
    lcd.print(mensagemUmidade);
	
    delay(5000);
	

    
  } else if(calculaUmidade >= 34 && calculaUmidade <= 50){
  	//sensor: Amarelo
	
	
	  lcd.clear();
	
	  lcd.setCursor(0,0);
	
	  lcd.print("Umidade Baixa");
	
	  lcd.setCursor(0,1);
	
	  lcd.print(mensagemUmidade);
	
	  delay(5000);
	


  } else if(calculaUmidade >= 51 && calculaUmidade <= 67){
	
	//sensor: Verde
	
	lcd.clear();
	
	lcd.setCursor(0,0);
	
	lcd.print("Ideal");
	
	lcd.setCursor(0,1);
	
	lcd.print(mensagemUmidade);
	
	delay(5000);
	
	
  } else if (calculaUmidade >= 68 && calculaUmidade <=83){
	
	
	lcd.clear();
	
	lcd.setCursor(0,0);
	
	lcd.print("Umido");
	
	lcd.setCursor(0,1);
	
	lcd.print(mensagemUmidade);
	
	delay(5000);
	
	
  } else if(calculaUmidade >= 84 && calculaUmidade <= 100){
  
	lcd.clear();
	
	lcd.setCursor(0,0);
	
	lcd.print("Muito Umido");
	
	lcd.setCursor(0,1);
	
	lcd.print(mensagemUmidade);
	
	delay(5000);
	

  } else if(calculaUmidade > 100){
  
	lcd.clear();
	
	lcd.setCursor(0,0);
	
	lcd.print("Valor excedido!");
	
	lcd.setCursor(0,1);
	
	lcd.print(mensagemUmidade);
	
	delay(5000);
	

  }else {
    
	lcd.clear();
	
	lcd.setCursor(0,0);
	
	lcd.print("ERROR!");
  }

  delay(30000);
  
}