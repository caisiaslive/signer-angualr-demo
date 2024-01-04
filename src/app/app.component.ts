import { Component } from '@angular/core';
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
  title = 'signer-demo';
  base64PdfString: string | undefined;
  iframeSrc: SafeResourceUrl | undefined;
  signForm!: FormGroup;
  
  constructor(private sanitizer: DomSanitizer, private fb: FormBuilder, private api: ApiService, private http: HttpClient){
//    const pdfBase64PdfString = "data:application/pdf;base64," + this.base64PdfString;
//    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(pdfBase64PdfString);
this.api.disableConsoleInProduction()
  }

  
  ngOnInit(): void {
    initFlowbite();
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
    })
  }
  clientMessage: any = "Initializing.......";
  clientStatus!: boolean;

  checkApiAvailability(): void {
    const apiUrl = 'http://localhost:63109/api/check'; // replace with your API endpoint

    this.http.get(apiUrl).subscribe(
      (data) => {
        this.clientMessage = "Desktop Signer is Running..."
        this.clientStatus = true;
      },
      (error) => {
        this.clientMessage = "Desktop Signer has not started"
        this.clientStatus = false;
        alert("Please start Desktop Signer Client")
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
  if (this.selectedFile) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.base64PdfString = fileReader.result as string;
      const fd = this.signForm.getRawValue();
      const jsonData = {
        filetype : 'pdf',
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
          alert(resp.responseMsg)
        }else{
          const pdfBase64PdfString = "data:application/pdf;base64," + resp.responseMsg;
          this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(pdfBase64PdfString);
        }
      }));
    };
    fileReader.readAsDataURL(this.selectedFile);
  }
}
}
