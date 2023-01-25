import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment/moment";

function App() {
  const [headers, setHeaders] = useState([]);
  const [datas, setDatas] = useState([]);
  const [fileName, setFileName] = useState("");
  const [date, setDate] = useState("")

  function downloadPdf() {
    // console.log(typeof fileName)
    let groups = devide_into_groups(datas);
    for (const e of groups) {
      e.groups = convert(e.groups);
    }
    for (const e of groups) {
      const doc = new jsPDF();
      const head = [e.groups.header];
      const body = e.groups.body;
      doc.setFontSize(11)
      doc.text(
        `Fan nomi: t'est`,
        // `Fan nomi: ${fileName}`,
        10,
        10
      );
      doc.text(
        `Guruh: ${e.title.replace(" cohort", "")}`,
        10,
        20
      );
      doc.text(
        `Sana: ${moment(Number(date)).format("DD-MM-YYYY")}`,
        10,
        30
      );
      autoTable(doc, {
        startY: 40,
        head: head,
        body: body,
      });
      doc.text("Ma'lumotlar bazasi bo'lim boshlig'i", 10, doc.lastAutoTable.finalY + 10);
      doc.text("Abdurauf", 170, doc.lastAutoTable.finalY + 10);
      doc.save(`${fileName} - ${e.title.replace(" cohort", "")}.pdf`);
    }
  }

  function devide_into_groups(data) {
    const groups = [];
    let group_list = data.map((e) => e["Guruh"]);
    group_list = new Set(group_list);
    let current_group = {
      title: "",
      groups: [],
    };
    current_group.title = data[0]["Guruh"];
    for (const t of group_list) {
      current_group.title = t;
      for (const e of data) {
        if (e["Guruh"] === t) {
          current_group.groups.push(e);
        }
      }
      groups.push(current_group);
      current_group = {
        title: "",
        groups: [],
      };
    }

    return groups;
  }

  function convert(data) {
    let header = [];
    for (const e of headers) {
      if (e.value) {
        header.push(e);
      }
    }
    const body = [];
    for (const element of data) {
      let cell = [];
      for (const con of header) {
        if (con.value) {
          if (con.title === "Guruh") {
            const group = element["Guruh"].replace(" cohort", "");
            cell.push(group);
          } else {
            cell.push(element[con.title]);
          }
        }
      }
      body.push(cell);
    }
    header = header.map((e) => {
      if (e.title === "Dastlabki nom") {
        return "Familiya";
      } else if (e.title === "Familiya") {
        return "Ism";
      } else {
        return e.title;
      }
    });
    return {
      header: header,
      body: body,
    };
  }

  function loadExcel(file) {
    setFileName(file.target.files[0].name.replace(".xlsx", " "));
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
      setDate(data[0]['Last downloaded from this course'] + '000')
      handleHeaders(data);
      const new_data = data.sort((a, b) => {
        return a["Dastlabki nom"].localeCompare(b["Dastlabki nom"]);
      });
      setDatas(new_data);
    });
  }

  function handleHeaders(data) {
    const keys = Object.keys(data[0]);
    const values = [];
    for (const el of keys) {
      if (
        el !== "Foydalanuvchi nomi" &&
        el !== "Bo'lim" &&
        el !== "Last downloaded from this course" &&
        el !== "Cohorts" &&
        !el.includes(" jami ")
      ) {
        values.push({
          title: el,
          value: true,
        });
      }
    }
    setHeaders(values);
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
      <div className="flex ">
        {headers?.map((data) => (
          <div key={data.title} className="flex flex-wrap mx-2 select-none">
            <label htmlFor={`${data.title}`}>{data.title}</label>
            <input
              type="checkbox"
              defaultChecked={data.value}
              id={`${data.title}`}
              onChange={(e) => {
                const new_data = {
                  title: data.title,
                  value: e.target.checked,
                };
                const new_headers = [];
                for (const e of headers) {
                  if (e.title === data.title) {
                    new_headers.push(new_data);
                  } else {
                    new_headers.push(e);
                  }
                }
                setHeaders(new_headers);
              }}
            />
          </div>
        ))}
      </div>
      <div
        className="test relative w-[500px] group hover:bg-blue-300 flex flex-col justify-center items-center border-[2px] border-slate-800 rounded-md p-[5px] mt-[15px] cursor-pointer"
        onClick={downloadPdf}
      >
        Yuklab olish
      </div>
    </div>
  );
}

export default App;
