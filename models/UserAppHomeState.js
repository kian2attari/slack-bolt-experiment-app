class UserAppHomeState {
  constructor() {
    this.currently_selected_repo = {
      repo_path: '',
      repo_id: '',
      // Object methods for setting a new repo
      set_repo(path, id) {
        try {
          this.repo_path = path;
          this.repo_id = id;
          this.currently_selected_project.clear_project();
          return true;
        } catch (error) {
          console.error(error);
          return false;
        }
      },

      // Clearing the repo
      clear_repo() {
        try {
          this.repo_path = '';
          this.repo_id = '';
          this.currently_selected_project.clear_project();
          return true;
        } catch (error) {
          console.error(error);
          return false;
        }
      },
      currently_selected_project: {
        project_id: '',
        project_name: '',
        set_project(name, id) {
          try {
            this.project_id = id;
            this.project_name = name;
            this.currently_selected_column.clear_column();
            return true;
          } catch (err) {
            console.error(err);
            return false;
          }
        },
        clear_project() {
          try {
            this.project_id = '';
            this.project_name = '';
            this.currently_selected_column.clear_column();
            return true;
          } catch (err) {
            console.error(err);
            return false;
          }
        },
        currently_selected_column: {
          column_id: '',
          column_name: '',
          set_column(name, id) {
            try {
              this.column_name = name;
              this.column_id = id;
              return true;
            } catch (error) {
              console.error(error);
              return false;
            }
          },
          clear_column() {
            try {
              this.column_id = '';
              this.column_name = '';
              return true;
            } catch (err) {
              console.error(err);
              return false;
            }
          },
        },
      },
    };
  }

  get_selected_repo_path() {
    return this.currently_selected_repo.repo_path;
  }

  get_selected_project_name() {
    return this.currently_selected_repo.currently_selected_project.project_name;
  }

  get_selected_column_name() {
    return this.currently_selected_repo.currently_selected_project
      .currently_selected_column.column_name;
  }
}

module.exports = UserAppHomeState;
