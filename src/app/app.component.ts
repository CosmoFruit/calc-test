import { Component, OnInit } from '@angular/core';
import { Plan } from './plan';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    
  data: any = {} ;
  cols : any[] = [] ;
  rows : any[] = [] ;
  area: number = 0 ;
  // value: number = 0 ;
  purchase: any [] = [{ total : null, items : [ ] }, { total : null, items : [] }] ;


  ngOnInit () { }

  computePurchase () {
      let value = this.area * this.data.expenditure;
      this.purchase = [{ total : null, items : [ ] }, { total : null, items : [] }] ;

      while ( value > 0 ) {
        value = this.computeStep( value );
      }

      console.log( this.purchase ) ;
      console.log( value ) ;
  }

  computeStep( value ): number {
    let minItem: any = { minLiter : Infinity } ;
    let maxItem: any = {} ;
    
    let amount: number = value ;    

    //Разбивка колонок на два набора
    let colSplit: any = this.splitCol ( amount ) ;
    
    //Поиск минимальныъ цен в найденных наборах
    if ( colSplit.minColSet[0] != undefined ) {
      //ищем минимальную цену за литр
      minItem = this.searchInCol ( 'liter', colSplit.minColSet ) ; 
    }   
    if ( colSplit.maxColSet[0] != undefined ) {
      //ищем минимальную цена за банку
      maxItem = this.searchInCol ( 'price', colSplit.maxColSet ) ; 
    }  

    //покупаем из верхней выборки когда в нижней пусто или выгоднее цена
    if ( maxItem.minLiter < minItem.minLiter ) {
        this.purchase[ 0 ].total = this.purchase[ 0 ].total + maxItem.minPrice ;
        this.purchase[ 0 ].items.push( maxItem ) ;  
        amount = amount - maxItem.size ;
    }
    
    //покупаем из нижней выборки пока не будет остатка
    while( amount > minItem.size ) {
        this.purchase[ 1 ].total = this.purchase[ 1 ].total + minItem.minPrice ;
        this.purchase[ 1 ].items.push( minItem ) ;
        amount = amount - minItem.size;      
    }    

    return amount; //возвращаем остаток
  }

  splitCol ( amount: number ) : {} {
      let minColSet: number[] = [] ; 
      let maxColSet: number[] = [] ;

      for ( let i=0; i<this.rows[ 0 ].tovar.length; i++ ) {          
        if ( amount >= this.rows[ 0 ].tovar[ i ].size ) {
            minColSet.push( i ) ;   
        } else {
            maxColSet.push( i ) ;
        }
      }

      return {minColSet, maxColSet};
  }

  searchInCol( key: string, set: number[] ) {          
          let item = { 
                      row: null, 
                      col: null, 
                      size: null,
                      minPrice: null,
                      minLiter: null
                     } ;
          let min = this.rows[ 0 ].tovar[ set[ 0 ] ][ key ] ;

          for ( let k=0; k<set.length; k++ )
            for ( let i=0; i<this.rows.length; i++ ) {
              if ( this.rows[ i ].tovar[ set[ k ] ][ key ] <= min ) {
                min = this.rows[ i ].tovar[ set[ k ] ][ key ] ;
                item.row = i ;
                item.col = set[ k ] ;
              }
            }

          item.size = this.rows[ item.row ].tovar[ item.col ].size ;
          item.minPrice = this.rows[ item.row ].tovar[ item.col ].price ;
          item.minLiter = this.rows[ item.row ].tovar[ item.col ].liter ;

          return item;
  }

  fileChange(event) {
    let fileList: FileList = event.target.files;

    this.data = {};
    if(fileList.length > 0) {
        let file: File = fileList[0];
        console.log(file.name);
        console.log(file);

        var myReader:FileReader = new FileReader();

        myReader.readAsText(file); 	

    	  myReader.onloadend = (e) => {
       	   this.data = JSON.parse(myReader.result);
      	   this.refreshTable();
    	  } 
    }

  }

  refreshTable () {
      console.log(this.data);

      this.cols = [];
      this.rows = [];

      //Парсинг обьекта для заголовка таблицы. В каждой колонке товар с параметрами
  	  for ( let key in this.data.materials ) {
  	   		let head = {
  	   			name: key,
  	   			value: this.data.materials[key]
  	   		}
  	   		this.cols.push(head); 
  	  }
      console.log(this.cols);

      //Парсинг обьекта для строк. В каждой строке поставщик и его товары с параметрами
  	  let step: number = 1;
      let j=0;

      for ( let key1 in this.data.prices ) {
  	   		let item = {
  	   			name: key1,
  	   			value: this.data.prices[key1],
            size: +this.cols[j++].value
  	   		}

  	   		if (step) {
  	   			for (let prop in item.value) {
  	   				let company = {
  	   					name: prop,
  	   					tovar: [{ id: item.name, 
                          price: +item.value[prop],
                          size: item.size 
                       }]
  	   				}
  	   				this.rows.push(company); 
  	   			}
  	   			step=0;
  	   		} else {  	   			
  	   			
            let i =0; 
            next:
  	   			for (let prop1 in item.value) { 
                //фильтр на отсуствие данных по товару у поставщика !!! НЕ ДОДЕЛАН !!!
                while ( i<this.rows.length ) {
                  if (this.rows[i].name === prop1) {
                      this.rows[i++].tovar.push({ id: item.name, 
                                                  price: +item.value[prop1],
                                                  size: item.size
                                               });
                      continue next;
                  } else {
                      this.rows[i++].tovar.push({ id: item.name, 
                                                  price: "отсутствует",
                                                  size: item.size 
                                               });
                  }
                }
  	   			}
  	   		}	  	   		   		
  	  }

      //Расчет стоимости за литр
      for (let i=0; i<this.rows.length; i++) {
          for (let j=0; j<this.rows[i].tovar.length; j++)
              this.rows[i].tovar[j].liter = this.rows[i].tovar[j].price/this.rows[i].tovar[j].size;
      }

      console.log(this.rows);

  }

}


