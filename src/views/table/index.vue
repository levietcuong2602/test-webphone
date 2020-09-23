<template>
  <div>
    <div id="app" ref="testHtml">
      <div class="row">
        <div class="col-3">
          <img class="logo" src="/logo.png" alt />
        </div>

        <div class="col-6 text-center">
          <h4>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h4>
          <p>(Bản thể hiện của hóa đơn điện tử)</p>
          <p>
            <span>Ngày:...........</span>
            <span>tháng:..........</span>
            <span>Năm:............</span>
          </p>
        </div>

        <div class="col-3">
          <p>
            Mẫu số:
            <strong>01GTKT0/001</strong>
          </p>
          <p>
            Ký hiệu:
            <strong>XV/19E</strong>
          </p>
          <p>
            Số:
            <strong class="text-danger">000000</strong>
          </p>
        </div>
      </div>
      <hr />
      <div class="company">
        <div class="row">
          <div class="col-6">
            <span>Đơn vị bán hàng:&nbsp;</span>
            <strong>{{ company }}</strong>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <span>Mã số thuế:&nbsp;</span>
            <strong>{{ tax }}</strong>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <span>Địa chỉ:&nbsp;</span>
            <strong>{{ address }}</strong>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <span>Số điện thoại&nbsp;</span>
            <strong>{{ phoneNumber }}</strong>
          </div>
          <div class="col-6">
            <span>Fax&nbsp;</span>
            <strong>{{ fax }}</strong>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <span>Số tài khoản:&nbsp;</span>
            <strong>{{ account }}</strong>
          </div>
        </div>
      </div>
      <hr />

      <div class="customer">
        <div class="row">
          <div class="col-6">
            <span>Họ tên người mua hàng:&nbsp;</span>
            <strong></strong>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <span>Tên đơn vị:&nbsp;</span>
            <strong></strong>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <span>Mã số thuế:&nbsp;</span>
            <strong></strong>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <span>Địa chỉ:&nbsp;</span>
            <strong></strong>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <span>Hình thức thanh toán:&nbsp;</span>
            <strong></strong>
          </div>
          <div class="col-6">
            <span>Số tài khoản:&nbsp;</span>
            <strong></strong>
          </div>
        </div>
      </div>
      <div class="row">
        <table id="tables">
          <tr>
            <th>STT</th>
            <th>Tên hàng hóa, dịch vụ</th>
            <th>Đơn vị tính</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
          <tr>
            <td>1</td>
            <td>1</td>
            <td>3</td>
            <td>4</td>
            <td>5</td>
            <td>20</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td colspan="5">Cộng tiền:</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="5">
              <div class="tax-table">
                <span>Thuế GTGT:</span>
                <span>Tiền thuế GTGT:</span>
              </div>
            </td>
            <td></td>
          </tr>
          <tr>
            <td colspan="5">Tổng tiền thanh toán:</td>
            <td></td>
          </tr>
        </table>
      </div>
      <div class="row mt-3">
        <div class="col-6">
          <span>Số tiền bằng chữ:</span>
        </div>
      </div>
      <div class="row">
        <div class="col-6 text-center">
          <p>
            <strong>Người mua hàng</strong>
          </p>
          <p>(Ký, ghi rõ họ, tên)</p>
        </div>
        <div class="col-6 text-center">
          <p>
            <strong>Người bán hàng</strong>
          </p>
          <p>(Ký, ghi rõ họ, tên)</p>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-6"></div>
        <div class="col-6 text-left">
          <p>
            <span>Ký bởi:</span>
            {{company}}
          </p>
          <p>
            <span>Ký ngày:</span>
            {{ "12/05/2018" }}
          </p>
        </div>
      </div>
    </div>
    <el-button class="btn btn-danger" @click="generatePdf">generate PDF</el-button>
  </div>
</template>

<script>
import html2pdf from "html2pdf.js";

export default {
  data() {
    return {
      company: "CÔNG TY CỔ PHẦN XÍCH VIỆT",
      address: "87 Vĩnh Phúc, Vĩnh Phúc, Ba Đình, Hà Nội",
      tax: "305050678",
      phoneNumber: "0968078124",
      account: "30126789 tại Ngân hàng TMCP Á Châu (AVB)-CN Sài Gòn",
      fax: "(028) 3931 1988",
    };
  },
  methods: {
    generatePdf() {
      const element = this.$refs.testHtml;
      const opt = {
        filename: "myfile.pdf",
        jsPDF: { unit: "in", format: "a4", orientation: "p" },
        pagebreak: { mode: "avoid-all", before: "#page2el" },
      };

      html2pdf().from(element).set(opt).save();
    },
  },
};
</script>
<style lang="css" scope>
#app {
  padding: 20px;
}
#app .logo {
  max-width: 100%;
  height: auto;
  object-fit: fill;
}
#app #tables {
  font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
  border-collapse: collapse;
  width: 100%;
  height: 300px;
}
#app #tables td,
#app #tables th {
  border-right: 1px solid #ddd;
  padding: 8px;
}
#app #tables tr {
  border: 1px solid #ddd;
  height: 35px;
}

#app #tables th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: center;
}
.tax-table {
  display: flex;
  justify-content: space-between;
  align-content: center;
}
</style>
