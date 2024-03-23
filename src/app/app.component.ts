import { Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { initFlowbite } from 'flowbite';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from './services/api.service';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  isLoading: boolean = false;

  lly: any = 100;
  llx: any = 300
  height: any = 80;
  width: any = 100
  uid: any;

  title = 'signer-demo';
  base64PdfString: string | undefined;
  @ViewChild('pdfIframe') pdfIframe: ElementRef | undefined;
  iframeSrc: SafeResourceUrl | undefined;
  signForm!: FormGroup;
  
  constructor(private sanitizer: DomSanitizer, private fb: FormBuilder, private api: ApiService, private http: HttpClient){
//    const pdfBase64PdfString = "data:application/pdf;base64," + this.base64PdfString;
//    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(pdfBase64PdfString);
this.api.disableConsoleInProduction()
  }

  
  ngOnInit(): void {
    initFlowbite();
    this.uid = this.generateRandomString(10);
    this.checkApiAvailability()
    this.signForm = this.fb.group({
      filedata: [null, Validators.required],
      llx : [null, Validators.required],
      lly: [null, Validators.required],
      width: [null, Validators.required],
      height: [null, Validators.required],
      reason: [null, Validators.required],
      signlocation: [null, Validators.required],
      signerid: [null, Validators.required],
      signpage: [null, Validators.required],
      // CheckCrl: [null, Validators.required],
    })
  }
  clientMessage: any = "Initializing.......";
  clientStatus!: boolean;

  checkApiAvailability(): void {
  this.api.getDesktopClientStatus().subscribe(
      (data) => {
        this.clientMessage = data.responseMsg
        this.clientStatus = true;
      },
      (error) => {  
        this.clientMessage = "DigiSigner has not started"
        this.clientStatus = false;
        alert("Please start DigiSigner Client")
      }
    );
  }
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop() || ''; // Extracts the file extension
  }
  selectedFile: File | undefined;
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    if (this.selectedFile) {
      const fileExtension = this.getFileExtension(this.selectedFile.name);
      if (fileExtension.toLowerCase() === 'pdf') {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          this.base64PdfString = fileReader.result as string;
          const pdfBase64PdfString = this.base64PdfString;
          this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(pdfBase64PdfString);
        };
        fileReader.readAsDataURL(this.selectedFile);
      } else {
        alert('Invalid file type. Please select a PDF file.');
        return;
      }
    }else{
      alert('Please select a PDF file.');
    }
  }

uploadPdf(): void {
  this.api.getDesktopClientStatus().subscribe(
    (data) => {
      this.clientMessage = data.responseMsg
      this.clientStatus = true;
    },
    (error) => {  
      this.clientMessage = "DigiSigner has not started"
      this.clientStatus = false;
      alert("Please start DigiSigner Client")
      return
    }
  );

  if (this.selectedFile) {
    this.showProgressSpinner();

    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.base64PdfString = fileReader.result as string;
      const fd = this.signForm.getRawValue();
      const jsonData = {
        filetype : 'pdf',
        // checkCrl: false,
        CertMatching: false,
        llx : fd.llx,
        lly: fd.lly,
        width: fd.width,
        height: fd.height,
        reason: fd.reason,
        signlocation: fd.signlocation,
        signerid: fd.signerid,
        signpage: fd.signpage,
        filedata: this.base64PdfString

      }
      this.api.postDataForSigning(jsonData).subscribe((resp=>{
        if(resp.responseCode !== 'SIGVAL'){
          this.hideProgressSpinner();
          alert(resp.responseMsg)
        }else{
          const pdfBase64PdfString = "data:application/pdf;base64," + resp.responseMsg;
          this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(pdfBase64PdfString);
          this.hideProgressSpinner();

        }
      }));
    };
    fileReader.readAsDataURL(this.selectedFile);
    }
  }

  showProgressSpinner = () => {
    this.isLoading = true;
  };
  hideProgressSpinner = () => {
    this.isLoading = false;
  };


  generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
