import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  error(message?: any, ...optionalParams: any[]): void {}
  constructor(public http: HttpClient) {
  }
  disableConsoleInProduction(): void { 
    if (environment.production) {
      console.warn(`🚨 Console output is disabled on production!`);
      console.log = function (): void { };
      console.debug = function (): void { };
      console.warn = function (): void { };
      console.info = function (): void { };
      console.error = function (): void { };
    }
  }

  clientHttpOptions = {
    headers: new HttpHeaders({
      'Access-Control-Allow-Origin':'*',       
      'Content-Type':  'application/json',
      'Authorization': environment.signerApiKey,
      'IpAddress-Header': environment.signerServerIp
    })
  };

  postDataForSigning(body: any){
    return this.http.post<any>(`${environment.clientServer}/route/signdata`, body, this.clientHttpOptions);
  }


  getDesktopClientStatus() {
    return this.http.get<any>(`${environment.clientServer}/api/check`, this.clientHttpOptions)
  }

}
