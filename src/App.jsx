import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function App() {
  function download(filename, text) {
    var element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  function test(filename, text) {
    const doc = new jsPDF()

    // autoTable(doc, {html})
    autoTable(doc, {
      head: [['Name', 'Last Name', 'Guruh', 'Cohorts', 'Test: Testga kirish(Real)', 'Kurs bo\'yicha jami (Real)']],
      body: [
        ['NORMURODOV', 'GULNOZAXON', 'MIIT-02', 'Raqamli iqtisodiyot', '93', '93'],
      ]
    })

    doc.save('test.pdf')

  }

  function loadExcel(file) {
    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file.target.files[0]);
      fileReader.onload = (e) => {
        const bufferArray = e.target.result;

        const wb = XLSX.read(bufferArray, { type: "buffer" });

        const wsname = wb.SheetNames[0];

        const ws = wb.Sheets[wsname];

        const data = XLSX.utils.sheet_to_json(ws);

        resolve(data);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
    promise.then((data) => {
      console.log(data);
      // checkObject(data);
    });
  }

  return (
    <div className="flex flex-col items-center justify-center mt-[50px]">
      <div className="test relative w-[500px] group hover:bg-blue-300 flex flex-col justify-center items-center border-[2px] border-slate-800 rounded-md p-[5px]">
        <svg
          className="w-[35px] h-[35px]"
          fill="blue"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
            clipRule="evenodd"
          />
        </svg>
        <div className="text-lg text-slate-700 group-hover:text-blue-700 font-bold mt-[5px]">
          Faylni yuklang
        </div>
        <input
          type="file"
          onClick={(e) => {
            e.target.value = null;
          }}
          onChange={loadExcel}
          className="w-full h-full opacity-0 absolute top-0 left-0 cursor-pointer"
        />
      </div>
      <div
        className=""
        onClick={test}
      >
        download
      </div>
      {/* <ul
        className={`${
          error?.length === 0 && "hidden"
        } w-[500px] border-[2px] border-slate-800 rounded-md mt-[20px] p-[15px]`}
      >
        {error?.map((e, i) => (
          <li key={i} className="text-red-600 underline">
            {e}
          </li>
        ))}
      </ul> */}
    </div>
  );
}

export default App;
