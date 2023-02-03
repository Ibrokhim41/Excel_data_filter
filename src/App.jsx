import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import qrcode from "qrcode-generator-es6";

function App() {
  const [headers, setHeaders] = useState([]);
  const [qrCodeLink, setQrCodeLink] = useState("");
  const [datas, setDatas] = useState([]);
  const [groups, setGroups] = useState([]);
  const [fileName, setFileName] = useState("");
  const [date, setDate] = useState("");

  function returnResult(e) {
    const keys = Object.keys(e);
    let result = keys
      .filter((e) => e.includes("(Real)"))
      .filter((e) => !e.includes("jami"));
    let new_result = "";
    for (const e of headers) {
      if (result.includes(e.title) && e.value) {
        new_result = e.title;
      }
    }
    return e[new_result];
  }

  function filterGroups(data, group) {
    const result = data.filter((e) => e.group == group.replace(" cohort", ""));
    return result;
  }

  function sortGroupForPost(data) {
    const res = [];
    const res2 = [];
    for (const e of data) {
      const el = {
        subject: fileName,
        date: date,
        last_name: e["Dastlabki nom"],
        first_name: e["Familiya"],
        group: e["Guruh"].replace(" cohort", ""),
        result: returnResult(e),
      };
      res.push(el);
    }
    return res;
  }

  async function getQrCode(groups, e) {
    let qr = await axios
      .post(
        // "http://10.10.115.20:8000/exam/result/v2/",
        "https://registr.tsue.uz/exam/result/v2/",
        {
          data: groups,
        }
      )
      .then((response) => {
        const docQr = document.createElement('div')
        docQr.setAttribute('id', 'qrimage')
        const qr = new qrcode(0, "H")
        qr.addData(response.data.url)
        qr.make()
        docQr.innerHTML = qr.createImgTag()
        const doc = new jsPDF();
        doc.addImage(docQr.children[0], "JPEG", 165, 5, 32, 32);
        const head = [e.groups.header];
        const body = e.groups.body;
        doc.setFontSize(11);
        doc.text(`Fan nomi: ${fileName}`, 15, 10);
        doc.text(`Guruh: ${e.title.replace(" cohort", "")}`, 15, 20);
        doc.text(`Sana: ${date}`, 15, 30);
        autoTable(doc, {
          theme: "grid",
          styles: { textColor: [0, 0, 0], fontStyle: "bold" },
          startY: 40,
          head: head,
          body: body,
        });
        // doc.text(
        //   "Ma'lumotlar bazasi bo'lim boshlig'i",
        //   15,
        //   doc.lastAutoTable.finalY + 10
        // );
        // doc.text("A.Xoliqov", 170, doc.lastAutoTable.finalY + 10);
        doc.save(`${fileName} - ${e.title.replace(" cohort", "")}.pdf`);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function downloadPdf() {
    if (datas == []) {
      alert("Fayl yuklanmagan");
      return false;
    }
    if (date === "") {
      alert("Sana kiritilmagan");
      return false;
    }
    for (const e of groups) {
      if (e.value) {
        const groups = sortGroupForPost(datas);
        const group_list = filterGroups(groups, e.title);
        getQrCode(group_list, e);
      }
    }

  }

  function devide_into_groups(data) {
    const groups = [];
    let group_list = data.map((e) => e["Guruh"]);
    group_list = new Set(group_list);
    let current_group = {
      title: "",
      groups: [],
      value: true,
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
        value: true,
      };
    }

    return groups;
  }

  function convert(data, headers) {
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
    for (let i = 0; i < body.length; i++) {
      body[i].unshift(i + 1);
    }
    header = header.map((e) => {
      if (e.title === "Dastlabki nom") {
        return "Familiya";
      } else if (e.title === "Familiya") {
        return "Ism";
      } else if (e.title.includes("(Real)")) {
        return "Natija";
      } else {
        return e.title;
      }
    });
    header.unshift("N");
    return {
      header: header,
      body: body,
    };
  }

  function loadExcel(file) {
    setFileName(
      file.target.files[0].name.replace(".xlsx", " ").replace("ʼ", "'")
    );
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
      const keys = Object.keys(data[0]);
      const headers = [];
      for (const el of keys) {
        if (
          el !== "Foydalanuvchi nomi" &&
          el !== "Bo'lim" &&
          el !== "Last downloaded from this course" &&
          el !== "Cohorts" &&
          !el.includes(" jami ")
        ) {
          headers.push({
            title: el,
            value: true,
          });
        }
      }
      setHeaders(headers);
      const new_data = data.sort((a, b) => {
        return a["Dastlabki nom"].localeCompare(b["Dastlabki nom"]);
      });
      let groups = devide_into_groups(data);
      for (const e of groups) {
        e.groups = convert(e.groups, headers);
      }
      setGroups(groups);
      setDatas(new_data);
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
        className={`${
          headers.length ? "flex" : "hidden"
        }  mt-4 border border-gray-400 py-1 px-2`}
      >
        {headers?.map((data) => (
          <div key={data.title} className="flex flex-wrap mx-2 select-none">
            <label htmlFor={`${data.title}`}>
              {data.title.replace(" cohort", "")}
            </label>
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
        className={`${
          headers.length ? "flex" : "hidden"
        }  mt-4 border border-gray-400 py-1 px-2`}
      >
        <div className="font-bold">Gruruhlar: </div>
        {groups?.map((data) => (
          <div key={data.title} className="flex flex-wrap mx-2 select-none">
            <label htmlFor={`${data.title}`}>{data.title}</label>
            <input
              type="checkbox"
              defaultChecked={data.value}
              id={`${data.title}`}
              onChange={(e) => {
                const new_data = {
                  ...data,
                  value: e.target.checked,
                };
                const new_group = [];
                for (const e of groups) {
                  if (e.title === data.title) {
                    new_group.push(new_data);
                  } else {
                    new_group.push(e);
                  }
                }
                setGroups(new_group);
              }}
            />
          </div>
        ))}
      </div>
      <div>
        <div
          className="w-auto flex justify-end"
          // onChange={(e) => setDate(moment(e.target.value).format("DD-MM-YYYY"))}
          onChange={(e) => setDate(e.target.value)}
        >
          <input
            type="date"
            className="border border-gray-500 rounded-md px-2 py-1 mt-2"
          />
        </div>
        <div
          className="test relative w-[500px] group hover:bg-blue-300 flex flex-col justify-center items-center border-[2px] border-slate-800 rounded-md p-[5px] mt-[15px] cursor-pointer"
          onClick={downloadPdf}
        >
          Yuklab olish
        </div>
      </div>
    </div>
  );
}

export default App;
